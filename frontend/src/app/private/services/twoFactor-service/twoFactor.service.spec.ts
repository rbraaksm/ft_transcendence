import { TestBed } from '@angular/core/testing';

import { TwoFactorService } from './twoFactor.service';

describe('TwoFactorService', () => {
  let service: TwoFactorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TwoFactorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
