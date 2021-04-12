import { FlightAuthGuard } from './flight-auth-guard.service';

describe('FlightAuthGuard', () => {
  it('should be defined', () => {
    expect(new FlightAuthGuard()).toBeDefined();
  });
});
