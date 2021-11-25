import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileusersComponent } from './profile-users.component';

describe('ProfileusersComponent', () => {
  let component: ProfileusersComponent;
  let fixture: ComponentFixture<ProfileusersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProfileusersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileusersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
