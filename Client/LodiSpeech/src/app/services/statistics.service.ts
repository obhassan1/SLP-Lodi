import {
  Injectable
} from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  environment
} from '../../environments/environment';


export interface StatisticsSummary {
  totalAppointments: number;

  scheduled: number;

  completed: number;

  cancelled: number;

  paidAppointments: number;

  unpaidAppointments: number;

  revenue: number;

  unpaidAmount: number;

  averageSessionRevenue: number;

  cancellationRate: number;

  completionRate: number;

  activePatients: number;

  newPatients: number;
}


export interface StatisticsMonthlyItem {
  key: string;

  label: string;

  appointments: number;

  completed: number;

  cancelled: number;

  revenue: number;
}


export interface TherapistPerformance {
  therapistId: string;

  name: string;

  appointments: number;

  completed: number;

  scheduled: number;

  cancelled: number;

  paidAppointments: number;

  unpaidAppointments: number;

  revenue: number;

  unpaidAmount: number;

  averageRevenue: number;

  cancellationRate: number;

  completionRate: number;
}


export interface DayStatistic {
  day: string;

  appointments: number;
}


export interface HourStatistic {
  hour: number;

  label: string;

  appointments: number;
}


export interface AdminStatistics {
  range: {
    from:
      string |
      null;

    to:
      string |
      null;

    therapist:
      string |
      null;
  };

  summary:
    StatisticsSummary;

  status: {
    scheduled:
      number;

    completed:
      number;

    cancelled:
      number;
  };

  payments: {
    paid:
      number;

    unpaid:
      number;
  };

  monthlyTrend:
    StatisticsMonthlyItem[];

  therapistPerformance:
    TherapistPerformance[];

  busiestDays:
    DayStatistic[];

  busiestHours:
    HourStatistic[];
}


@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  private api =
    `${environment.apiUrl}/statistics`;


  constructor(
    private http:
      HttpClient
  ) {}


  getDashboard(
    from?: string,
    to?: string,
    therapist?: string
  ) {
    let params =
      new HttpParams();

    if (from) {
      params =
        params.set(
          'from',
          from
        );
    }

    if (to) {
      params =
        params.set(
          'to',
          to
        );
    }

    if (therapist) {
      params =
        params.set(
          'therapist',
          therapist
        );
    }

    return this.http.get<
      AdminStatistics
    >(
      `${this.api}/dashboard`,
      {
        params
      }
    );
  }
}