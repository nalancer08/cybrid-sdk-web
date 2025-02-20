import { OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { AssetBankModel } from '@cybrid/cybrid-api-bank-angular';
import { ConfigService } from '../services/config/config.service';
import { Constants } from '../constants/constants';
import { map, Subject, takeUntil } from 'rxjs';
import { formatNumber } from '@angular/common';
import { Big } from 'big.js';
import '@angular/common/locales/global/fr';

interface NumberSeparator {
  locale: string;
  char: string;
}

@Pipe({
  name: 'asset'
})
export class AssetPipe implements PipeTransform, OnDestroy {
  locale = '';
  separator: NumberSeparator[] = [
    { locale: 'en-US', char: '.' },
    { locale: 'fr-CA', char: ',' }
  ];
  unsubscribe$: Subject<any> = new Subject();

  constructor(private configService: ConfigService) {
    this.initLocale();
  }

  ngOnDestroy() {
    this.unsubscribe$.next('');
    this.unsubscribe$.complete();
  }

  initLocale(): void {
    this.configService
      .getConfig$()
      .pipe(
        takeUntil(this.unsubscribe$),
        map((config) => {
          return (this.locale = config.locale);
        })
      )
      .subscribe();
  }

  transform(value: string | number, asset: AssetBankModel): string {
    const divisor = new Big(10).pow(asset.decimals);
    const baseUnit = new Big(value).div(divisor);
    if (baseUnit.toString().includes('.')) {
      let separator = this.separator.find((value) => {
        return value.locale == this.locale;
      });
      let integer = baseUnit.toString().split('.')[0];
      let decimal = baseUnit.toString().split('.')[1];
      if (decimal.length < Constants.MIN_FRACTION_DIGITS) {
        decimal += '0';
      }
      return (
        asset.symbol +
        formatNumber(new Big(integer).toNumber(), this.locale) +
        separator!.char +
        decimal
      );
    } else {
      const digitsInfo =
        Constants.MIN_INTEGER_DIGITS.toString() +
        '.' +
        Constants.MIN_FRACTION_DIGITS.toString() +
        '-' +
        asset.decimals.toString();
      return (
        asset.symbol +
        formatNumber(baseUnit.toNumber(), this.locale, digitsInfo)
      );
    }
  }
}
