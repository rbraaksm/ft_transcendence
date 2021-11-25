import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwoFactorDisabledComponent } from './two-factor-disabled.component';

describe('TwoFactorDisabledComponent', () => {
  let component: TwoFactorDisabledComponent;
  let fixture: ComponentFixture<TwoFactorDisabledComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TwoFactorDisabledComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TwoFactorDisabledComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
