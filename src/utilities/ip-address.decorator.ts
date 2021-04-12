import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import * as requestIp from 'request-ip';

export const IpAddress = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (request.clientIp) return request.clientIp;
    return requestIp.getClientIp(request); // In case we forgot to include requestIp.mw() in main.ts
});
