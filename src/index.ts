import fetch from "node-fetch";
import * as utilities from "./utilities";
export { utilities };
const { currencyExchange, diffDays, addDays } = utilities;
const API_ENDPOINT = "http://api.exchangeratesapi.io/v1/";

const DEFAULT_BASE = "EUR";

export interface IExchangeratesapiParams {
  date?: string;
  base?: string;
  symbols?: string | string[];
}

export interface IExchangeratesapiRates {
  [key: string]: number;
}

export interface IExchangeratesapiResponse {
  success: boolean;
  timestamp: number;
  base: string;
  date: string;
  rates: IExchangeratesapiRates;
}

export interface IExchangeratesapiConvertParams {
  from: string;
  to: string;
  amount: number;
  date?: string;
}

export interface IExchangeratesapiConvertResponse {
  success: boolean;
  query: {
    from: string;
    to: string;
    amount: number;
  };
  info: {
    timestamp: number;
    rate: number;
  };
  historical: "" | true;
  date: string;
  result: number;
}

export interface IExchangeratesapiTimeseriesParams {
  start_date: string;
  end_date: string;
  base?: string;
  symbols?: string | string[];
}

export interface IExchangeratesapiTimeseriesRates {
  [key: string]: IExchangeratesapiRates;
}
export interface IExchangeratesapiTimeseriesResponse {
  success: boolean;
  timeseries: true;
  start_date: string;
  end_date: string;
  base: string;
  rates: IExchangeratesapiTimeseriesRates;
}

export class exchangeratesapi {
  private ACCESS_KEY = "";

  constructor(ACCESS_KEY: string) {
    if (!ACCESS_KEY) {
      throw new Error(
        "You have not supplied an API Access Key. Please get your API Access Key at https://exchangeratesapi.io/"
      );
    }
    this.ACCESS_KEY = ACCESS_KEY;
  }

  public async latest(
    params?: IExchangeratesapiParams
  ): Promise<IExchangeratesapiResponse> {
    return await this.historical({
      date: "latest",
      base: params ? params.base : undefined,
      symbols: params ? params.symbols : undefined,
    });
  }

  public async historical(
    params: IExchangeratesapiParams
  ): Promise<IExchangeratesapiResponse> {
    let date = "latest";
    if (params && params.date) date = params.date;

    let symbols = "";
    if (params.symbols && params.symbols instanceof Array) {
      for (const symbol of params.symbols) {
        if (symbols === "") symbols = symbol;
        else symbols += `,${symbol}`;
      }
    } else {
      symbols = params.symbols ? params.symbols : "";
    }

    let base = DEFAULT_BASE;
    if (params.base && params.base !== DEFAULT_BASE) {
      if (!symbols.includes(params.base)) symbols += `,${params.base}`;
    } else if (params.base) {
      base = params.base;
    }

    let url = `${API_ENDPOINT}/${date}?access_key=${this.ACCESS_KEY}&base=${base}`;
    if (symbols) url += `&symbols=${symbols}`;

    const response = await this.request(url);
    if (params.base && base !== params.base) {
      const responseRates = response.rates;
      const rates: IExchangeratesapiRates = {};
      if (params.symbols) {
        if (params.symbols instanceof Array) {
          for (const symbol of params.symbols) {
            if (symbol in responseRates && params.base in responseRates)
              rates[symbol] = currencyExchange(
                responseRates[params.base],
                responseRates[symbol]
              );
          }
        } else if (
          params.symbols in responseRates &&
          params.base in responseRates
        ) {
          rates[params.symbols] = currencyExchange(
            responseRates[params.base],
            responseRates[params.symbols]
          );
        }
      } else {
        for (const symbol of Object.keys(responseRates)) {
          rates[symbol] = currencyExchange(
            responseRates[params.base],
            responseRates[symbol]
          );
        }
      }
      if (!Object.keys(rates).length) {
        throw new Error(
          "You have provided one or more invalid Currency Codes."
        );
      }
      response.base = params.base;
      return {
        success: response.success,
        timestamp: response.timestamp,
        base: params.base,
        date: response.date,
        rates: rates,
      };
    } else {
      return response;
    }
  }

  public async convert(
    params: IExchangeratesapiConvertParams
  ): Promise<IExchangeratesapiConvertResponse> {
    const requestParams: IExchangeratesapiParams = {
      date: params.date,
      base: DEFAULT_BASE,
      symbols: [params.from, params.to],
    };
    const rates = await this.historical(requestParams);
    let rate;
    if (params.from in rates.rates && params.to in rates.rates) {
      rate = currencyExchange(
        rates.rates[params.from],
        rates.rates[params.to]
      );
    } else {
      throw new Error("You have provided one or more invalid Currency Codes.");
    }
    return {
      success: rates.success,
      query: {
        from: params.from,
        to: params.to,
        amount: params.amount,
      },
      info: {
        timestamp: rates.timestamp,
        rate: rate,
      },
      historical: params.date ? true : "",
      date: rates.date,
      result: Math.round(rate * params.amount * 1000000) / 1000000,
    };
  }

  public async timeseries(
    params: IExchangeratesapiTimeseriesParams
  ): Promise<IExchangeratesapiTimeseriesResponse> {
    const startDate = new Date(Date.parse(params.start_date));
    const endDate = new Date(Date.parse(params.end_date));
    if (startDate.valueOf() > endDate.valueOf()) {
      throw new Error("The end_date is older than the start_date.");
    }
    const rateResponses = [];
    const days = diffDays(params.start_date, params.end_date);
    for (let i = 0; i < days + 1; i++) {
      const rateParams: IExchangeratesapiParams = {
        date: addDays(startDate, i),
        base: params.base,
        symbols: params.symbols,
      };
      rateResponses.push(await this.historical(rateParams));
    }
    const rates: IExchangeratesapiTimeseriesRates = {};
    for (const rateResponse of rateResponses) {
      if (params.symbols instanceof Array) {
        rates[rateResponse.date] = {};
        for (const symbol of params.symbols) {
          if (symbol in rateResponse.rates)
            rates[rateResponse.date][symbol] = rateResponse.rates[symbol];
        }
      } else {
        rates[rateResponse.date] = rateResponse.rates;
      }
    }
    return {
      success: true,
      timeseries: true,
      start_date: params.start_date,
      end_date: params.end_date,
      base: params.base ? params.base : DEFAULT_BASE,
      rates: rates,
    };
  }

  private async request(
    url: string
  ): Promise<IExchangeratesapiResponse | IExchangeratesapiResponse> {
    const response = await fetch(url, {
      method: "GET",
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(
            `${res.status} ${res.statusText} ${JSON.stringify(
              await res.json()
            )}`
          );
        }
        return res.json();
      })
      .then((json: IExchangeratesapiResponse) => {
        return json;
      });
    return response;
  }
}

export default exchangeratesapi;
