import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatRadioChange } from '@angular/material/radio';
import { ActivatedRoute, Router } from '@angular/router';
import { UserI } from 'src/app/model/user/user.interface';
import { ChatService } from '../../services/chat-service/chat.service';

@Component({
  selector: 'app-create-room',
  templateUrl: './create-room.component.html',
  styleUrls: ['./create-room.component.scss'],
})
export class CreateRoomComponent {

	radiocheck: boolean = true;
	beforeType: string = 'public';
	form: FormGroup = new FormGroup({
	  name: new FormControl(null, [Validators.required]),
	  description: new FormControl(null),
	  password: new FormControl({value: '', disabled: true}),
	  users: new FormArray([], [Validators.required]),
	  admin: new FormArray([]),
	  muted: new FormArray([]),
	  type: new FormControl({value: 'public'} , [Validators.required]),
	});

  constructor(private chatService: ChatService,
	private router: Router,
	private activatedRoute: ActivatedRoute,
	) { }

  create() {
    if (this.form.valid) {
      try {
		if (this.form.get('type').value != 'protected' && this.form.get('type').value != 'private')
			this.form.get('type').setValue('public');
        this.chatService.createRoom(this.form.getRawValue());
        this.router.navigate(['../dashboard'], { relativeTo: this.activatedRoute });
      } catch (error) {
        
      }
    }
  }

  initUser(user: UserI) {
    return new FormControl({
      id: user.id,
      username: user.username,
      email: user.email
    });
  }

  addUser(userFormControl: FormControl) {
    this.users.push(userFormControl);
  }

  addAdmin(userFormControl: FormControl) {
	this.admin.push(userFormControl);
  }

  removeUser(userId: number) {
    this.users.removeAt(this.users.value.findIndex((user: UserI) => user.id === userId));
  }

  get name(): FormControl {
    return this.form.get('name') as FormControl;
  }

  get description(): FormControl {
    return this.form.get('description') as FormControl;
  }

  get users(): FormArray {
    return this.form.get('users') as FormArray;
  }
  
  get admin(): FormArray {
    return this.form.get('admin') as FormArray;
  }

  radioPassword($event: MatRadioChange) {
    if ($event.value == 'no') {
		this.form.get('password').clearValidators();
        this.form.get('password').disable();
		this.form.get('password').setValue('');
		this.form.get('type').setValue(this.beforeType);
    }
	else {
		this.form.get('password').setValidators([Validators.required]);
		this.form.get('password').enable();
		this.form.get('type').setValue('protected');
	}
  }

  radioType($event: MatRadioChange) {
	if ($event.value == 'public') {
		this.form.get('type').setValue('public');
		this.beforeType = 'public';
	}
	else {
		this.form.get('type').setValue('private');
		this.beforeType = 'private';
	}
  }

}
