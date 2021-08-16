import { HttpException, HttpService, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';
import { CommitInfo } from './dto/commit-info.dto';
import { ReleaseInfo } from './dto/release-info.dto';
import { PullInfo } from './dto/pull-info.dto';
import { ArtifactInfo } from './dto/artifact-info.dto';

@Injectable()
export class GitVersionsService {
  private readonly logger = new Logger(GitVersionsService.name);

  private readonly headers: any;

  constructor(private readonly http: HttpService,
              private readonly configService: ConfigService) {
      const token = this.configService.get<string>('github.token');

      if (token) {
          this.headers = { Authorization: `token ${token}` };
      }
  }

  getCommitOfBranch(user: string, repo: string, branch: string): Observable<CommitInfo> {
      this.logger.debug(`Trying to fetch commit info for ${user}/${repo}/refs/${branch}`);

      return this.http.get<any>(`https://api.github.com/repos/${user}/${repo}/commits/${branch}`, { headers: this.headers })
          .pipe(
              tap((response) => this.logger.debug(`Response status ${response.status} for GitHub commit request`)),
              map((response) => ({
                  sha: response.data.sha,
                  shortSha: response.data.sha.slice(0, 7),
                  timestamp: response.data.commit.committer.date,
              })),
              catchError(
                  (err) => {
                      this.logger.error(err);
                      throw new HttpException('Could not fetch GitHub commit', err.response.status || err.status || 500);
                  },
              ),
          );
  }

  getReleases(user: string, repo: string, includePreReleases: boolean): Observable<ReleaseInfo[]> {
      this.logger.debug(`Trying to fetch releases for ${user}/${repo}`);

      return this.http.get<any>(`https://api.github.com/repos/${user}/${repo}/releases`, { headers: this.headers })
          .pipe(
              tap((response) => this.logger.debug(`Response status ${response.status} for GitHub commit request`)),
              map((response) => {
                  const releases: ReleaseInfo[] = [];

                  response.data.filter((rel) => includePreReleases || !rel.prerelease).forEach((rel) => {
                      releases.push({
                          name: rel.name,
                          htmlUrl: rel.html_url,
                          publishedAt: rel.published_at,
                          body: rel.body,
                      });
                  });

                  return releases;
              }),
              catchError(
                  (err) => {
                      this.logger.error(err);
                      throw new HttpException('Could not fetch GitHub releases', err.response.status || err.status || 500);
                  },
              ),
          );
  }

  getPulls(user: string, repo: string): Observable<PullInfo[]> {
      this.logger.debug(`Trying to fetch pulls for ${user}/${repo}`);

      return this.http.post<any>('https://api.github.com/graphql', {
          query: `{repository(owner:"${user}",name:"${repo}"){pullRequests(first:100,states:OPEN)
      {nodes{number title state isDraft author{login}labels(first:10){nodes{name color id}}}}}}`,
      }, { headers: this.headers })
          .pipe(
              tap((response) => this.logger.debug(`Response status ${response.status} for GitHub pull requests`)),
              map((response) => {
                  const pulls: PullInfo[] = [];

                  response.data.data.repository.pullRequests.nodes.forEach((pull) => {
                      pulls.push({
                          number: pull.number,
                          title: pull.title,
                          author: pull.author.login,
                          labels: pull.labels.nodes,
                          isDraft: pull.isDraft,
                      });
                  });

                  return pulls;
              }),
              catchError(
                  (err) => {
                      this.logger.error(err);
                      throw new HttpException('Could not fetch GitHub pull requests', err.response?.status || err.status || 500);
                  },
              ),
          );
  }

  async getArtifactForPull(user: string, repo: string, pull: string): Promise<ArtifactInfo> {
      // Fuck you GH API for making me do this
      const checkIds = await this.http.get<string>(`https://github.com/${user}/${repo}/pull/${pull}/checks`, { headers: this.headers })
          .pipe(
              tap((response) => this.logger.debug(`Response status ${response.status} for GitHub pull request checks`)),
              map((response) => {
                  const matches = response.data.match(new RegExp(`<a href="/${user}/${repo}/actions/runs/(\\d+)"`, 'g'));
                  const ids = [];

                  for (const match of matches) {
                      ids.push(/runs\/(\d+)/g.exec(match)[1]);
                  }

                  return ids;
              }),
              catchError(
                  (err) => {
                      this.logger.error(err);
                      throw new HttpException('Could not fetch GitHub checks for PR', err.response?.status || err.status || 500);
                  },
              ),
          ).toPromise();

      const artifacts = await Promise.all(checkIds.map(async (checkId) => this.http.get<any>(
          `https://api.github.com/repos/${user}/${repo}/actions/runs/${checkId}/artifacts`, { headers: this.headers },
      )
          .pipe(
              tap((response) => this.logger.debug(`Response status ${response.status} for GitHub artifact request`)),
              map((response) => {
                  if (response.data.total_count !== 1) {
                      return undefined;
                  }

                  return response.data.artifacts[0].archive_download_url;
              }),
              catchError(
                  (err) => {
                      this.logger.error(err);
                      throw new HttpException('Could not fetch GitHub artifact for check', err.response?.status || err.status || 500);
                  },
              ),
          ).toPromise()));

      if (!artifacts.some((x) => x !== undefined)) {
          throw new HttpException('Could not find artifact for PR', 404);
      }

      return { artifactUrl: artifacts.find((x) => x !== undefined) };
  }
}
