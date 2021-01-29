import { Injectable, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { IndexedDb } from 'src/app/model/indexedDb';

@Injectable({
  providedIn: 'root',
})
export class IndexedDBService {
  private indexedDB: any;
  private dbName: string;
  objectData: IndexedDb;
  finalData: any[] = [];

  dBName = new EventEmitter<string>();

  constructor() {
    this.indexedDB = indexedDB;
    this.dbName = 'db-' + Math.random();
  }

  //set name of database
  setdbName(dbName: string): void {
    if (dbName.length > 0 && dbName !== undefined) {
      this.dbName = dbName;
    } else {
      console.log('Error: wrong dbName');
    }
  }

  updateDataInDB(source: string, object: any): Observable<any> {
    let self = this;

    return new Observable((observer: any) => {
      this.open().subscribe((db: any) => {
        let tx = db.transaction(source, 'readwrite');
        let store = tx.objectStore(source);
        store.put(object);

        tx.oncomplete = () => {
          observer.next(object);
          db.close();
          observer.complete();
        };
        db.onerror = (e: any) => {
          db.close();
          self.handleError('IndexedDB error: ' + e.target.errorCode);
        };
      });
    });
  }

  insertDataInDb(source: string, object: any): Observable<any> {
    let self = this;

    return new Observable((observer: any) => {
      this.open().subscribe((db: any) => {
        let tx = db.transaction(source, 'readwrite');
        let store = tx.objectStore(source);
        let request = store.add(object);

        request.onsuccess = (e: any) => {
          observer.next(e.target.result);
          db.close();
          observer.complete();
        };
        db.onerror = (e: any) => {
          db.close();
          self.handleError('IndexedDB error: ' + e.target.errorCode);
        };
      });
    });
  }

  get(source: string, id: number): Observable<any> {
    let self = this;

    return new Observable((observer: any) => {
      this.open().subscribe((db: any) => {
        let tx = db.transaction(source, 'readonly');
        let store = tx.objectStore(source);
        let index = store.index('id');
        let request = index.get(id);

        request.onsuccess = () => {
          observer.next(request.result);
          db.close();
          observer.complete();
        };
        db.onerror = (e: any) => {
          db.close();
          self.handleError('IndexedDB error: ' + e.target.errorCode);
        };
      });
    });
  }

  extractData(source: string, filter?: any): Observable<any[]> {
    let self = this;

    return new Observable((observer: any) => {
      let indexName = 'id';

      this.open().subscribe((db: any) => {
        let tx = db.transaction(source, 'readonly');
        let store = tx.objectStore(source);
        let index = store.index(indexName);
        let request = index.openCursor(); //IDBKeyRange.only("Fred")
        let results: any[] = [];

        request.onsuccess = function () {
          let cursor = request.result;
          if (cursor) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            observer.next(results);
            db.close();
            observer.complete();
          }
        };
        db.onerror = (e: any) => {
          db.close();
          self.handleError('IndexedDB error: ' + e.target.errorCode);
        };
      });
    });
  }

  getDept(): Observable<any[]> {
    return new Observable((obs: any) => {
      //this.open().subscribe(async (db: any) => {
      this.indexedDB.databases().then((r) => {
        obs.next(r);
        obs.complete();
      });
    });
  }

  getStoreName(): Observable<any[]> {
    return new Observable((obs: any) => {
      this.open().subscribe((db: any) => {
        var sheet = [];
        for (let key of db.objectStoreNames) sheet.push(key);
        obs.next(sheet);
        db.close();
        obs.complete();
      });
    });
  }

  getIndexes(e: any): Observable<any[]> {
    var sheet = [];
    return new Observable((obs: any) => {
      this.open().subscribe(async (db: any) => {
        for (let key of db.objectStoreNames) {
          if (key == e) {
            let tx = db.transaction(key, 'readonly');
            let store = tx.objectStore(key);
            obs.next(store.indexNames);
            db.close();
            obs.complete();
          }
        }
      });
    });
  }

  remove(source: string, id: number): Observable<any> {
    let self = this;

    return new Observable((observer: any) => {
      this.open().subscribe((db: any) => {
        let tx = db.transaction(source, 'readwrite');
        let store = tx.objectStore(source);

        store.delete(id);

        tx.oncomplete = (e: any) => {
          observer.next(id);
          db.close();
          observer.complete();
        };
        db.onerror = (e: any) => {
          db.close();
          self.handleError('IndexedDB error: ' + e.target.errorCode);
        };
      });
    });
  }

  count(source: string): Observable<number> {
    let self = this;

    return new Observable((observer: any) => {
      this.open().subscribe((db: any) => {
        let indexName = 'id';
        let tx = db.transaction(source, 'readonly');
        let store = tx.objectStore(source);
        let index = store.index(indexName);
        let request = index.count();

        request.onsuccess = () => {
          observer.next(request.result);
          db.close();
          observer.complete();
        };
        db.onerror = (e: any) => {
          db.close();
          self.handleError('IndexedDB error:' + e.target.errorCode);
        };
      });
    });
  }

  //Create database and assigns value in database
  createDB(schema: any[], dbName: string) {
    let self = this;

    //return new Observable((observer: any) => {
    this.dbName = dbName;
    let request = this.indexedDB.open(this.dbName);
    request.onupgradeneeded = () => {
      // The database did not previously exist, so create object stores and indexes.
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
            else keypath = index.replace(/[^A-Z0-9]+/gi, '');
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

      //observer.next('done');
      // observer.complete();
    };

    request.onerror = () => {
      self.handleError(request.error);
    };

    request.onsuccess = () => {
      let db = request.result;
      db.close();
    };
    //});
  }

  //Delete database
  deleteDB(): Observable<any> {
    let self = this;

    return new Observable((observer: any) => {
      let request = this.indexedDB.deleteDatabase(this.dbName);

      request.onsuccess = () => {
        observer.next('done');
        observer.complete();
      };
      request.onerror = () => {
        self.handleError('Could not delete indexed db.');
      };
      request.onblocked = () => {
        self.handleError(
          'Couldn not delete database due to the operation being blocked.'
        );
      };
    });
  }

  //Clear store fn
  clearStore(source: string): Observable<any> {
    let self = this;

    return new Observable((observer: any) => {
      this.open().subscribe((db: any) => {
        let tx = db.transaction(source, 'readwrite');
        let store = tx.objectStore(source);

        store.clear();

        tx.oncomplete = (e: any) => {
          db.close();
          observer.complete();
        };
        db.onerror = (e: any) => {
          db.close();
          self.handleError('IndexedDB error:' + e.target.errorCode);
        };
      });
    });
  }

  private handleError(msg: string) {
    return Observable.throw(msg);
  }

  //Opens databse with particular nameand assigns value
  open(): Observable<any> {
    let self = this;

    return new Observable((observer: any) => {
      let request = this.indexedDB.open(this.dbName);

      request.onsuccess = () => {
        observer.next(request.result);
        observer.complete();
      };
      request.onerror = () => self.handleError(request.error);
    });
  }

  updateData() {
    this.open().subscribe((db: any) => {
      var trans = db.transaction('Sheet1', 'readwrite');
      var store = trans.objectStore('Sheet1');

      store.openCursor().onsuccess = function (evt) {
        const cursor = evt.target.result;
        if (cursor) {
          cursor.value.Alias = 'brokl';
          const request = cursor.update(cursor.value);
          request.onsuccess = function () {};
        }
      };
      var index = store.index('Volume');
    });
  }
}
