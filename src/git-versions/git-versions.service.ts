import { HttpException, HttpService, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CommitInfo, ReleaseInfo } from './git-versions.class';
import { catchError, map, tap } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GitVersionsService {
  private readonly logger = new Logger(GitVersionsService.name);

  private readonly headers: any;

  constructor(private readonly http: HttpService,
              private readonly configService: ConfigService) {
    const token = this.configService.get<string>('github.token');

    if (!!token) {
      this.headers = {
        Authorization: `token ${token}`
      }
    }
  }

  getCommitOfBranch(user: string, repo: string, branch: string): Observable<CommitInfo> {
    this.logger.debug(`Trying to fetch commit info for ${user}/${repo}/refs/${branch}`);

    return this.http.get<any>(`https://api.github.com/repos/${user}/${repo}/commits/${branch}`, {
      headers: this.headers
    })
      .pipe(
        tap(response => this.logger.debug(`Response status ${response.status} for GitHub commit request`)),
        map(response => {
          return {
            sha: response.data.sha,
            timestamp: response.data.commit.committer.date,
          }
        }),
        catchError(
          err => {
            this.logger.error(err);
            throw new HttpException('Could not fetch GitHub commit', err.response.status || 500);
          },
        ),
      );
  }

  getReleases(user: string, repo: string): Observable<ReleaseInfo[]> {
    this.logger.debug(`Trying to fetch releases for ${user}/${repo}`);

    return this.http.get<any>(`https://api.github.com/repos/${user}/${repo}/releases`, {
      headers: this.headers
    })
      .pipe(
        tap(response => this.logger.debug(`Response status ${response.status} for GitHub commit request`)),
        map(response => {
          const releases: ReleaseInfo[] = [];

          response.data.forEach(rel => {
            releases.push({
              name: rel.name,
              htmlUrl: rel.html_url,
              publishedAt: rel.published_at,
            })
          })

          return releases;
        }),
        catchError(
          err => {
            this.logger.error(err);
            throw new HttpException('Could not fetch GitHub releases', err.response.status || 500);
          },
        ),
      );
  }
}
