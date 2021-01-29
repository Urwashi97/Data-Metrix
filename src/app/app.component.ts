import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'dataMetrix';
  lines: any = []; //for headings
  linesR: any = []; // for rows
  file: any = File;
  dbName: string;
  friend: any = [];
  csvLoaded: boolean = false;
  finalArray: any = [];

  ngOnInit() {
    this.checkIndexDB();
  }

  //File upload function
  changeListener(e: any) {
    (this.lines = []), (this.linesR = []);
    let files = e.target.files;
    if (files && files.length > 0) {
      this.file = files.item(0);
      //File reader method
      let reader: FileReader = new FileReader();
      reader.readAsText(this.file);
      reader.onload = (e) => {
        this.csvLoaded = true;
        let csv: any = reader.result;
        let allTextLines: any = [];
        allTextLines = csv.trim().split(/\r|\n|\r/);
        //Table Headings
        let headers = allTextLines[0].split(';');
        let data = headers;
        for (let j = 0; j < headers.length; j++) {
          this.lines.push(data[j]);
        }
        let arrl = allTextLines.length;
        let rows = [];
        for (let i = 1; i < arrl; i++) {
          rows.push(allTextLines[i].split(';'));
        }
        for (let j = 0; j < arrl; j++) {
          this.linesR.push(rows[j]);
        }
        for (let key2 of this.linesR) {
          if (!(key2 == '')) {
            this.finalArray.push(key2.toString().split(','));
          }
        }
      };
    }
  }

  checkIndexDB() {
    var indexedDB = window.indexedDB;
    if (!indexedDB) {
      console.log("Your browser doesn't support IndexedDB ");
    } else console.log('Your browser supports IndexedDB ');
  }

  createStore() {
    let frndData = [
      { Name: 'ABC', Email: 'ABC@hotmail.com', Location: 'Nagpur' },
      { Name: 'DEF', Email: 'DEF@hotmail.com', Location: 'Mumbai' },
      { Name: 'GHI', Email: 'GHI@hotmail.com', Location: 'Pune' },
      {
        Name: 'JKL',
        Email: 'JKL@gmail.com',
        Location: 'Philadelphia, Pennsylvania',
      },
      { Name: 'MNO', Email: 'MNO@gmail.com', Location: 'Delhi' },
    ];
    var dBName = this.dbName;
    var dBVersion = 3;
    var dBObj: any;
    var request = indexedDB.open(dBName, dBVersion);
    request.onsuccess = function (e) {
      console.log('Database Opened');
      dBObj = request.result;
    };

    request.onerror = function (e) {
      console.log('Error Occurred');
    };

    request.onupgradeneeded = function (e) {
      var db = request.result;
      var objectStore = db.createObjectStore('friends', {
        keyPath: 'Name',
        autoIncrement: true,
      });
      objectStore.createIndex('Name', 'Name', { unique: false });
      objectStore.createIndex('Email', 'Email', { unique: true });
      objectStore.createIndex('Location', 'Location', { unique: false });

      objectStore.transaction.oncomplete = function (e) {
        var frndObjectStore = db
          .transaction('friends', 'readwrite')
          .objectStore('friends');
        frndData.forEach(function (data) {
          frndObjectStore.add(data);
        });
      };

      //Removing data from database
      /*var request = db.transaction(["friends"], "readwrite")
        .objectStore("friends")
        .delete("444-44-4444");
      request.onsuccess = function (event) {
        // It's gone!
      };*/

      //Getting data from the database
      /*var transaction = db.transaction(["friends"]);
      var objectStore = transaction.objectStore("friends");
      var request = objectStore.get("444-44-4444");
      request.onerror = function (event) {
        // Handle errors!
      };
      request.onsuccess = function (event) {
        // Do something with the request.result!
        console.log("Name for SSN 444-44-4444 is " + request.result.name);
      };
      or

      db.transaction("friends").objectStore("friends").get("444-44-4444").onsuccess = function (event) {
        console.log("Name for SSN 444-44-4444 is " + event.target.result.name);
      };*/

      //updating data in database
      /*var objectStore = db.transaction(["friends"], "readwrite").objectStore("friends");
      var request = objectStore.get("444-44-4444");
      request.onerror = function (event) {
        // Handle errors!
      };
      request.onsuccess = function (event) {
        // Get the old value that we want to update
        var data = event.target.result;

        // update the value(s) in the object that you want to change
        data.age = 42;

        // Put this updated object back into the database.
        var requestUpdate = objectStore.put(data);
        requestUpdate.onerror = function (event) {
          // Do something with the error
        };
        requestUpdate.onsuccess = function (event) {
          // Success - the data is updated!
        };
      };*/

      /*for (let i in this.frndData) {
        objectStore.add(this.frndData[i])
      }*/
    };
  }
}
