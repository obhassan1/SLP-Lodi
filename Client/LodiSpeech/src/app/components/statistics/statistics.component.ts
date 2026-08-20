import {
  Component,
  OnInit
} from '@angular/core';

import {
  User
} from '../../models/patient.model';

import {
  UserService
} from '../../services/user.service';

import {
  AdminStatistics,
  StatisticsService
} from '../../services/statistics.service';


type Period =
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'last12Months'
  | 'all'
  | 'custom';


@Component({
  selector:
    'app-statistics',

  templateUrl:
    './statistics.component.html',

  styleUrls: [
    './statistics.component.css'
  ]
})
export class StatisticsComponent
implements OnInit {

  loading =
    false;

  error =
    '';

  data:
    AdminStatistics |
    null =
      null;

  therapists:
    User[] =
      [];

  selectedTherapist =
    '';

  period:
    Period =
      'thisMonth';

  customFrom =
    '';

  customTo =
    '';


  constructor(
    private statisticsApi:
      StatisticsService,

    private usersApi:
      UserService
  ) {}


  ngOnInit(): void {
    this.loadTherapists();

    this.load();
  }


  loadTherapists(): void {
    this.usersApi
      .list()
      .subscribe({
        next:
          users => {
            this.therapists =
              users.filter(
                user =>
                  user.active &&
                  (
                    user.role ===
                      'therapist' ||
                    !!user
                      .canTreatPatients
                  )
              );
          }
      });
  }


  changePeriod(): void {
    if (
      this.period !==
      'custom'
    ) {
      this.load();
    }
  }


  applyCustomRange(): void {
    this.load();
  }


  load(): void {
    const range =
      this.getRange();

    this.loading =
      true;

    this.error =
      '';

    this.statisticsApi
      .getDashboard(
        range.from,
        range.to,
        this.selectedTherapist
      )
      .subscribe({
        next:
          response => {
            this.data =
              response;

            this.loading =
              false;
          },

        error:
          error => {
            this.loading =
              false;

            this.error =
              error?.error
                ?.message ||
              'Could not load statistics';
          }
      });
  }


  getRange(): {
    from?: string;
    to?: string;
  } {
    if (
      this.period ===
      'all'
    ) {
      return {};
    }

    if (
      this.period ===
      'custom'
    ) {
      return {
        from:
          this.customFrom ||
          undefined,

        to:
          this.customTo ||
          undefined
      };
    }

    const now =
      new Date();

    let from =
      new Date(
        now
      );

    let to =
      new Date(
        now
      );

    if (
      this.period ===
      'thisMonth'
    ) {
      from =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );

      to =
        new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0
        );
    }


    if (
      this.period ===
      'lastMonth'
    ) {
      from =
        new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );

      to =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          0
        );
    }


    if (
      this.period ===
      'thisYear'
    ) {
      from =
        new Date(
          now.getFullYear(),
          0,
          1
        );

      to =
        new Date(
          now.getFullYear(),
          11,
          31
        );
    }


    if (
      this.period ===
      'last12Months'
    ) {
      from =
        new Date(
          now.getFullYear(),
          now.getMonth() - 11,
          1
        );

      to =
        new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0
        );
    }


    return {
      from:
        this.formatDate(
          from
        ),

      to:
        this.formatDate(
          to
        )
    };
  }


  private formatDate(
    date: Date
  ): string {
    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        '0'
      );

    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        '0'
      );

    return `${year}-${month}-${day}`;
  }


  money(
    value:
      number |
      null |
      undefined
  ): string {
    return new Intl
      .NumberFormat(
        'en-US',
        {
          minimumFractionDigits:
            0,

          maximumFractionDigits:
            2
        }
      )
      .format(
        Number(
          value ||
          0
        )
      );
  }


  percent(
    value:
      number |
      null |
      undefined
  ): string {
    return `${Number(
      value ||
      0
    ).toFixed(1)}%`;
  }


  maxRevenue(): number {
    const values =
      this.data
        ?.monthlyTrend
        .map(
          item =>
            item.revenue
        ) ||
      [];

    return Math.max(
      ...values,
      1
    );
  }


  revenueHeight(
    revenue: number
  ): number {
    return Math.max(
      4,
      (
        revenue /
        this.maxRevenue()
      ) * 100
    );
  }


  maxMonthlyAppointments():
    number {
    const values =
      this.data
        ?.monthlyTrend
        .map(
          item =>
            item.appointments
        ) ||
      [];

    return Math.max(
      ...values,
      1
    );
  }


  appointmentHeight(
    count: number
  ): number {
    return Math.max(
      4,
      (
        count /
        this
          .maxMonthlyAppointments()
      ) * 100
    );
  }


  maxTherapistRevenue():
    number {
    const values =
      this.data
        ?.therapistPerformance
        .map(
          item =>
            item.revenue
        ) ||
      [];

    return Math.max(
      ...values,
      1
    );
  }


  therapistRevenueWidth(
    revenue: number
  ): number {
    return (
      revenue /
      this
        .maxTherapistRevenue()
    ) * 100;
  }


  maxDayCount(): number {
    const values =
      this.data
        ?.busiestDays
        .map(
          item =>
            item.appointments
        ) ||
      [];

    return Math.max(
      ...values,
      1
    );
  }


  dayWidth(
    count: number
  ): number {
    return (
      count /
      this.maxDayCount()
    ) * 100;
  }


  maxHourCount(): number {
    const values =
      this.data
        ?.busiestHours
        .map(
          item =>
            item.appointments
        ) ||
      [];

    return Math.max(
      ...values,
      1
    );
  }


  hourWidth(
    count: number
  ): number {
    return (
      count /
      this.maxHourCount()
    ) * 100;
  }


  statusTotal(): number {
    if (!this.data) {
      return 1;
    }

    return Math.max(
      this.data
        .status
        .scheduled +
      this.data
        .status
        .completed +
      this.data
        .status
        .cancelled,
      1
    );
  }


  statusPercent(
    value: number
  ): number {
    return (
      value /
      this.statusTotal()
    ) * 100;
  }


  paymentTotal(): number {
    if (!this.data) {
      return 1;
    }

    return Math.max(
      this.data
        .payments
        .paid +
      this.data
        .payments
        .unpaid,
      1
    );
  }


  paymentPercent(
    value: number
  ): number {
    return (
      value /
      this.paymentTotal()
    ) * 100;
  }
}