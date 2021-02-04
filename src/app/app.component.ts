import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'dataMetrix';

  ngOnInit() {
    this.checkIndexDB();
  }
  checkIndexDB() {
    var indexedDB = window.indexedDB;
    if (!indexedDB) {
      console.log("Your browser doesn't support IndexedDB ");
    } else console.log('Your browser supports IndexedDB ');
  }
}
