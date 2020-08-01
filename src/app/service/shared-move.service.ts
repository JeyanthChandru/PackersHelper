import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SharedMove } from '../models/new-shared-move/new-shared-move.model';
import { AngularFireDatabase } from '@angular/fire/database';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { NavigationExtras } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SharedMoveService {
  sharedKeys: Observable<any>;
  sharedMove: Observable<SharedMove[]>;
  constructor(private db: AngularFireDatabase, private authService: AuthService) {
  }

  async getAllSharedKeys() {
    this.sharedKeys = this.db.list<string>('users/' + btoa(await this.authService.getEmail())).snapshotChanges().pipe(
      map(changes =>
        changes.map(c => (c.payload.val()))
      )
    );
    return this.sharedKeys
  }

  getSharedMoveDetails($key) {
    this.sharedMove = this.db.list<SharedMove>('/shared/' + $key).snapshotChanges().pipe(
      map(changes =>
        changes.map(c => ({ $key: c.payload.key, ...c.payload.val() }))
      )
    );
    return this.sharedMove;
  }

  createSharedMove() {
    return this.db.database.ref('/shared').push().key;
  }

  async addMoveToDB($key, sharedMove: SharedMove) {
    let userEmail = await this.authService.getEmail();
    sharedMove.admin = btoa(userEmail);
    sharedMove.emails.forEach(email => {
      this.db.list('/users/' + btoa(email)).push($key);
    });
    if (sharedMove.emails.indexOf(userEmail) == -1) {
      sharedMove.emails.push(userEmail);
      this.db.list('/users/' + btoa(userEmail)).push($key);
    }
    this.db.database.ref('/shared').child($key).push(sharedMove);
  }

  removeEmails(emails: Array<string>, key) {
    emails.forEach(email => {
      var listEmails = this.db.list('/users/' + btoa(email)).snapshotChanges().pipe(
        map(changes =>
          changes.map(c => ({ $key: c.payload.key, val: c.payload.val() }))
        )
      );
      listEmails.subscribe(data => {
        data.forEach(d => {
          if (d.val == key) {
            this.db.list('/users/' + btoa(email)).remove(d.$key);
          }
        })
      });
    });
  }

  removeMove(sm: SharedMove, key) {
    this.removeEmails(sm.emails, key);
    this.db.list('/shared/').remove(key);
  }

  updateSharedMoveOnly(sharedKey: string, sharedMoveKey: string, sharedMove: SharedMove) {
    this.db.list('/shared/' + sharedKey).update(sharedMoveKey, sharedMove);
  }

  async updateSharedMove(sharedKey: string, sharedMoveKey: string, removedEmails: Array<string>, addedEmails: Array<string>, sharedMove: SharedMove) {
    const userEmail = await this.authService.getEmail();
    if (removedEmails.indexOf(userEmail) != -1) {
      removedEmails = removedEmails.filter(email => email != userEmail);
      sharedMove.emails.push(userEmail);
    }
    if (removedEmails.length != 0) {
      this.removeEmails(removedEmails, sharedKey);
    }
    if (addedEmails.length != 0) {
      // sharedMove.emails = addedEmails;
      addedEmails.forEach(email => {
        this.db.list('/users/' + btoa(email)).push(sharedKey);
      });
    }
    this.db.list('/shared/' + sharedKey).update(sharedMoveKey, sharedMove);
  }

  populateSharedMove(sharedMove: SharedMove, sharedKey: String) {
    let navigationExtras : NavigationExtras = {
      state: {
        sharedMove: sharedMove,
        sharedKey: sharedKey
      }
    }

    return navigationExtras;
  }
}
