import { Component, OnInit, ViewChild } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { IndexedDBService } from '../../service/indexed-db.service';
import { GridService } from '../../service/grid.service';
import { IndexedDb } from '../../model/indexedDb';

import * as XLSX from 'xlsx';
type AOA = any[][];

@Component({
  selector: 'app-csv-reader',
  templateUrl: './csv-reader.component.html',
  styleUrls: ['./csv-reader.component.css'],
})
export class CsvReaderComponent implements OnInit {
  data: AOA = [];
  csvSelected: boolean = false;
  fileName: string = 'SheetJS.xlsx';
  dbContent: any = [];
  deptName: any = [];
  fiscalYear: any = [];
  displayedColumns: any = [];
  objectData: IndexedDb;
  uploadFileData: any = [];

  @ViewChild(MatSort) sort: MatSort;

  dataSource = new MatTableDataSource<Element>(this.dbContent);

  constructor(
    public indexedDbService: IndexedDBService,
    public dbService: GridService
  ) {
    this.initializeObservable();
  }

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  initializeObservable() {
    this.indexedDbService.getDept().subscribe((r) => {
      this.deptName = r;
      this.deptSelected(this.deptName[0].name);
    });
  }

  onFileUpload(evt: any) {
    this.fiscalYear = [];
    /* wire up file reader */
    const target: DataTransfer = <DataTransfer>evt.target;
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      this.uploadFileData = [];
      this.dbContent = [];
      this.csvSelected = true;
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      wb.SheetNames.forEach((sheetName: string) =>
        this.fiscalYear.push(sheetName)
      );
      this.uploadFileData = this.formatData(wb);
      this.dbContent = this.uploadFileData;
      var dbName = 'db_' + Math.random();
      this.indexedDbService.createDB(this.uploadFileData, dbName);
      this.deptSelected(dbName);
    };
    reader.readAsBinaryString(target.files[0]);
  }

  deptSelected(e: any) {
    this.csvSelected = false;
    this.indexedDbService.setdbName(e);
    this.indexedDbService.getStoreName().subscribe(
      (r) => {
        this.fiscalYear = r;
        if (this.fiscalYear.length > 0) this.yearSelected(this.fiscalYear[0]);
        else alert('Db is empty');
      },
      (err) => {}
    );
  }

  yearSelected(e) {
    if (this.csvSelected) {
      for (let key of this.uploadFileData) {
        if (e == key.storeName) {
          this.displayedColumns = key.indexes;
          this.dbContent = key.data;
        }
      }
    } else {
      this.indexedDbService.extractData(e).subscribe((r) => {
        this.dbContent = r;
      });
      this.indexedDbService.getIndexes(e).subscribe((r) => {
        this.displayedColumns = r;
      });
    }
  }

  formatData(wb: any) {
    let jsoncsv = {};
    var sheetData = {};
    for (let key of this.fiscalYear) {
      var indexes = [];
      const wsname: string = key;
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      jsoncsv = XLSX.utils.sheet_to_json(ws);
      for (let e in jsoncsv) {
        if (e == '0') {
          for (let u in jsoncsv[e]) indexes.push(u);
        }
      }
      sheetData[wsname] = jsoncsv;
      this.objectData = {
        storeName: wsname,
        indexes: indexes,
        data: jsoncsv,
      };
      this.uploadFileData.push(this.objectData);
    }
    return this.uploadFileData;
  }

  onKeyPress(e: any, value: any) {}

  sortData(sort: Sort) {
    const data = this.dbContent.slice();
    if (!sort.active || sort.direction === '') {
      this.dbContent = data;
      return;
    }
    this.dbContent = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      for (let key of this.displayedColumns) {
        switch (sort.active) {
          case key:
            return this.compare(a[key], b[key], isAsc);
        }
      }
    });
  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  exportCSV(): void {
    /* generate worksheet */
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(this.data);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    XLSX.writeFile(wb, this.fileName);
  }

  scroll(event: KeyboardEvent) {
    //console.log('keyEvent', event);
  }

  readOnly(i: any) {
    if (i == 'Tax Status') return true;
    else return false;
  }

  contentEditable(i: any) {
    return true;
    if (i == 'Tax Status') {
      console.log('tr');
      return false;
    } else {
      console.log('false');
      return true;
    }
  }

  insertData() {
    this.indexedDbService.updateData();
    return;
    let data = {
      Alias: 'Falli tel',
      'Category Name': 'Oil',
      'Cost Price': 110,
      'Default Rate': 125,
      'Default Unit of Measurement': 'Ltr',
      'Other Unit of Measurement': 'Unit,Jar,Ml',
      'Product Code': 'GRO9',
      'Product Name': 'Ground Nut Oil',
      'Sort Order': 7,
      'Special Price': 105,
      Status: 1,
      'Tax Status': 'Non Taxable',
      Volume: 1,
      Weight: 0,
    };
    this.indexedDbService
      .insertDataInDb('Sheet1', data)
      .subscribe((res: any) => {
        this.indexedDbService
          .extractData('Sheet1')
          .subscribe((order: any) => console.log('207', order));
      });
  }
}
