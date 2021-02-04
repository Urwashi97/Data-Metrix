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
  currentDept: String;
  currentYear: String;
  jsonForTotal: []
  dataSourceContent: any = []
  fixed = ['id', 'Category', 'Dept.'];

  @ViewChild(MatSort) sort: MatSort;

  dataSource = new MatTableDataSource<Element>(this.dataSourceContent);

  constructor(
    public indexedDbService: IndexedDBService,
    public dbService: GridService
  ) {
    this.initializeObservable();
  }

  ngOnInit(): void { }

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
      this.dataSourceContent = this.dbContent
      var dbName = 'db_' + Math.random();
      this.indexedDbService.createDB(this.uploadFileData, dbName);
      this.deptSelected(dbName);
    };
    reader.readAsBinaryString(target.files[0]);
  }

  deptSelected(e: any) {
    this.currentDept = e;
    this.csvSelected = false;
    this.indexedDbService.setdbName(e);
    this.indexedDbService.getStoreName().subscribe(
      (r) => {
        this.fiscalYear = r;
        if (this.fiscalYear.length > 0) this.yearSelected(this.fiscalYear[0]);
        else alert('Db is empty');
      },
      (err) => { }
    );
  }

  yearSelected(e) {
    this.currentYear = e;
    this.indexedDbService.currentDB(this.currentDept, this.currentYear);
    if (this.csvSelected) {
      for (let key of this.uploadFileData) {
        if (e == key.storeName) {
          this.displayedColumns = key.indexes;
          this.dbContent = key.data;
          this.dataSourceContent = this.dbContent
        }
      }
    } else {
      this.indexedDbService.extractData(e).subscribe((r) => {
        this.dbContent = r;
        console.log('110', this.dbContent)
        this.dataSourceContent = this.dbContent
      });
      this.indexedDbService.getIndexes(e).subscribe((r) => {
        this.displayedColumns = Object.values(r).sort(function (a, b) { return r[a] - r[b] })
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

  sortData(sort: Sort) {
    const data = this.dbContent.slice();
    if (!sort.active || sort.direction === '') {
      this.dbContent = data;
      this.dataSourceContent = this.dbContent
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
    this.dataSourceContent = this.dbContent
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

  readOnly(i: any) {
    if (i == 'Tax Status') return true;
    else return false;
  }

  contentEditable(i: any) {
    if (i == 'Tax Status') {
      return false;
    } else {
      return true;
    }
  }

  updateList(col, element, event) {
    const editField = event.target.textContent;
    for (let key of this.dbContent) {
      if (key.id == element.id) {
        key[col] = parseInt(editField.trim());
        this.indexedDbService.updateData(key);
      }
    }
  }

  iconClick(col) {
    if (!this.fixedCol(col))
      var i = 0
    this.dataSourceContent.forEach(e => {
      if (col == 'W-01' || col == 'W-02' || col == 'W-03' || col == 'W-04') {
        var MNT1 = e['W-01'] + e['W-02'] + e['W-03'] + e['W-04']
        e['MNT-1'] = MNT1
        delete e['W-01']
        delete e['W-02']
        delete e['W-03']
        delete e['W-04']
      }
      if (col == 'W-05' || col == 'W-06' || col == 'W-07' || col == 'W-08') {
        var MNT2 = e['W-05'] + e['W-06'] + e['W-07'] + e['W-08']
        e['MNT-2'] = MNT2
        delete e['W-05']
        delete e['W-06']
        delete e['W-07']
        delete e['W-08']
      }
      if (col == 'W-09' || col == 'W-10' || col == 'W-11' || col == 'W-12') {
        var MNT3 = e['W-09'] + e['W-10'] + e['W-11'] + e['W-12']
        e['MNT-3'] = MNT3
        delete e['W-09']
        delete e['W-10']
        delete e['W-11']
        delete e['W-12']
      }
      if (col == 'W-13' || col == 'W-14' || col == 'W-15' || col == 'W-16') {
        var MNT4 = e['W-13'] + e['W-14'] + e['W-15'] + e['W-16']
        e['MNT-4'] = MNT4
        delete e['W-13']
        delete e['W-14']
        delete e['W-15']
        delete e['W-16']
      }
      if (col == 'W-17' || col == 'W-18' || col == 'W-19' || col == 'W-20') {
        var MNT5 = e['W-17'] + e['W-18'] + e['W-19'] + e['W-20']
        e['MNT-5'] = MNT5
        delete e['W-17']
        delete e['W-18']
        delete e['W-19']
        delete e['W-20']
      }
      if (col == 'W-21' || col == 'W-22' || col == 'W-23' || col == 'W-24') {
        var MNT6 = e['W-21'] + e['W-22'] + e['W-23'] + e['W-24']
        e['MNT-6'] = MNT6
        delete e['W-21']
        delete e['W-22']
        delete e['W-23']
        delete e['W-24']
      }
      if (col == 'W-25' || col == 'W-26' || col == 'W-27' || col == 'W-28') {
        var MNT7 = e['W-25'] + e['W-26'] + e['W-27'] + e['W-28']
        e['MNT-7'] = MNT7
        delete e['W-25']
        delete e['W-26']
        delete e['W-27']
        delete e['W-28']
      }
      if (col == 'W-29' || col == 'W-30' || col == 'W-31' || col == 'W-32') {
        var MNT8 = e['W-29'] + e['W-30'] + e['W-31'] + e['W-32']
        e['MNT-8'] = MNT8
        delete e['W-29']
        delete e['W-30']
        delete e['W-31']
        delete e['W-32']
      }
      if (col == 'W-33' || col == 'W-34' || col == 'W-35' || col == 'W-36') {
        var MNT9 = e['W-33'] + e['W-34'] + e['W-35'] + e['W-36']
        e['MNT-9'] = MNT9
        delete e['W-33']
        delete e['W-34']
        delete e['W-35']
        delete e['W-36']
      }
      if (col == 'W-37' || col == 'W-38' || col == 'W-39' || col == 'W-40') {
        var MNT10 = e['W-37'] + e['W-38'] + e['W-39'] + e['W-40']
        e['MNT-10'] = MNT10
        delete e['W-37']
        delete e['W-38']
        delete e['W-39']
        delete e['W-40']
      }
      if (col == 'W-41' || col == 'W-42' || col == 'W-43' || col == 'W-44') {
        var MNT11 = e['W-41'] + e['W-42'] + e['W-43'] + e['W-44']
        e['MNT-11'] = MNT11
        delete e['W-41']
        delete e['W-42']
        delete e['W-43']
        delete e['W-44']
      }
      if (col == 'W-45' || col == 'W-46' || col == 'W-47' || col == 'W-48') {
        var MNT12 = e['W-45'] + e['W-46'] + e['W-47'] + e['W-48']
        e['MNT-12'] = MNT12
        delete e['W-45']
        delete e['W-46']
        delete e['W-47']
        delete e['W-48']
      }
      if (col == 'W-49' || col == 'W-50' || col == 'W-51' || col == 'W-52') {
        var MNT13 = e['W-49'] + e['W-50'] + e['W-51'] + e['W-52']
        e['MNT-13'] = MNT13
        delete e['W-49']
        delete e['W-50']
        delete e['W-51']
        delete e['W-52']
      }
    });
    console.log('262', this.dataSourceContent)
    this.dataSourceContent.forEach(ele => {
      i++
      if (i == 1) {
        var column = [];
        for (let key in ele)
          column.push(key)
        this.displayedColumns = column
      }
    });
  }

  fixedCol(id) {
    if (this.fixed.includes(id)) return true;
    else return false;
  }

  calculateTotal(col) {
    if (this.fixedCol(col))
      return ''
    else {
      var total = 0;
      for (let i = 0; i < this.dbContent.length; i++) {
        total = total + parseInt(this.dbContent[i][col])
      }
      if (!isNaN(total))
        return total
    }
  }
}
