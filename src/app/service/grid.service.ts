import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';

import { IndexedDBService } from './indexed-db.service';

@Injectable({
  providedIn: 'root',
})
export class GridService {
  private indexedDB: any;
  private dbName: string;

  constructor(public indexedDb: IndexedDBService) {
    this.indexedDB = indexedDB;
    this.dbName = 'db';
  }

  dbImport(): Observable<any[]> {
    var sheet = [];
    return new Observable((obs: any) => {
      this.indexedDb.open().subscribe(async (db: any) => {
        for (let key of db.objectStoreNames) {
          sheet.push(key);
        }
        obs.next(sheet);
        db.close();
        obs.complete();
      });
    });
  }

  dbExport(schema?: any[]) {
    let self = this;

    let request = this.indexedDB.open(this.dbName);

    request.onupgradeneeded = () => {
      let db = request.result;

      for (let i = 0; i < schema.length; i++) {
        let store = db.createObjectStore(schema[i].storeName, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('id', 'id', { unique: true });

        if (schema[i].indexes !== undefined) {
          for (let j = 0; j < schema[i].indexes.length; j++) {
            let index = schema[i].indexes[j];
            if (parseInt(index)) var keypath = '_' + index;
            else keypath = index.replace(/ /g, '');
            store.createIndex(`${index}`, keypath);
          }
        }

        if (schema[i].data !== undefined) {
          for (let j = 0; j < schema[i].data.length; j++) {
            let seed = schema[i].data[j];
            store.put(seed);
          }
        }
      }
    };

    request.onerror = () => {
      self.handleError(request.error);
    };

    request.onsuccess = () => {
      let db = request.result;
      db.close();
    };
  }

  getdbByFiscalYear() {}

  getdbByDept() {}

  updateDB() {}

  getAllFiscalYear() {}

  getAllDept() {
    this.indexedDB.databases().then((r) => console.log('320', r));
  }

  private handleError(msg: string) {
    return Observable.throw(msg);
  }
}
