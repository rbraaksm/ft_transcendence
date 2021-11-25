import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionRoomComponent } from './option-room.component';

describe('OptionRoomComponent', () => {
  let component: OptionRoomComponent;
  let fixture: ComponentFixture<OptionRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OptionRoomComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OptionRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
