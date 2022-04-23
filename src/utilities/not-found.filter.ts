import { ArgumentsHost, Catch, ExceptionFilter, Logger, NotFoundException } from '@nestjs/common';

@Catch(NotFoundException)
export class NotFoundExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(NotFoundExceptionFilter.name);

    catch(exception: NotFoundException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();

        this.logger.log(`404 '${request.url}' '${JSON.stringify(request.headers)}'`);

        response
            // @ts-ignore
            .status(status)
            .json({
                statusCode: status,
                timestamp: new Date().toISOString(),
                path: request.url,
            });
    }
}
