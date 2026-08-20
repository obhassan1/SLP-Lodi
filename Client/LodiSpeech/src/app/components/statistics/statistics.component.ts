import {
  Component,
  OnInit
} from '@angular/core';

import {
  ChartData,
  ChartOptions
} from 'chart.js';

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
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit {

  loading = false;

  error = '';

  data: AdminStatistics | null = null;

  therapists: User[] = [];

  selectedTherapist = '';

  period: Period = 'thisMonth';

  customFrom = '';

  customTo = '';


  /*
   * =========================================
   * REVENUE CHART
   * =========================================
   */

  revenueChartData: ChartData<'line'> = {
    labels: [],

    datasets: [
      {
        label: 'Revenue',
        data: [],
        tension: 0.35,
        fill: false
      }
    ]
  };


  /*
   * =========================================
   * APPOINTMENT TREND CHART
   * =========================================
   */

  appointmentChartData: ChartData<'line'> = {
    labels: [],

    datasets: [
      {
        label: 'Appointments',
        data: [],
        tension: 0.35,
        fill: false
      },

      {
        label: 'Completed',
        data: [],
        tension: 0.35,
        fill: false
      },

      {
        label: 'Cancelled',
        data: [],
        tension: 0.35,
        fill: false
      }
    ]
  };


  /*
   * =========================================
   * REVENUE BY THERAPIST
   * =========================================
   */

  therapistRevenueChartData: ChartData<'bar'> = {
    labels: [],

    datasets: [
      {
        label: 'Revenue',
        data: []
      }
    ]
  };


  /*
   * =========================================
   * APPOINTMENT STATUS
   * =========================================
   */

  statusChartData: ChartData<'doughnut'> = {
    labels: [
      'Scheduled',
      'Completed',
      'Cancelled'
    ],

    datasets: [
      {
        data: []
      }
    ]
  };


  /*
   * =========================================
   * BUSIEST DAYS
   * =========================================
   */

  busiestDaysChartData: ChartData<'bar'> = {
    labels: [],

    datasets: [
      {
        label: 'Appointments',
        data: []
      }
    ]
  };


  /*
   * =========================================
   * CHART OPTIONS
   * =========================================
   */

  readonly lineChartOptions: ChartOptions<'line'> = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      }
    },

    scales: {
      y: {
        beginAtZero: true
      }
    }
  };


  readonly barChartOptions: ChartOptions<'bar'> = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      }
    },

    scales: {
      y: {
        beginAtZero: true
      }
    }
  };


  readonly doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      }
    }
  };


  constructor(
    private statisticsApi: StatisticsService,
    private usersApi: UserService
  ) {}


  ngOnInit(): void {

    this.loadTherapists();

    this.load();

  }


  /*
   * =========================================
   * LOAD THERAPISTS
   * =========================================
   */

  loadTherapists(): void {

    this.usersApi
      .list()
      .subscribe({

        next: users => {

          this.therapists =
            users.filter(
              user =>
                user.active &&
                (
                  user.role === 'therapist' ||
                  !!user.canTreatPatients
                )
            );

        },

        error: error => {

          console.error(
            'Could not load therapists',
            error
          );

        }

      });

  }


  /*
   * =========================================
   * PERIOD CHANGED
   * =========================================
   */

  changePeriod(): void {

    if (
      this.period !== 'custom'
    ) {

      this.load();

    }

  }


  /*
   * =========================================
   * CUSTOM DATE RANGE
   * =========================================
   */

  applyCustomRange(): void {

    this.load();

  }


  /*
   * =========================================
   * LOAD STATISTICS
   * =========================================
   */

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

        next: response => {

          this.data =
            response;

          this.buildCharts();

          this.loading =
            false;

        },

        error: error => {

          console.error(
            'Statistics error:',
            error
          );

          this.loading =
            false;

          this.error =
            error?.error?.message ||
            'Could not load statistics';

        }

      });

  }


  /*
   * =========================================
   * BUILD ALL CHARTS
   * =========================================
   */

  buildCharts(): void {

    if (
      !this.data
    ) {

      return;

    }


    const months =
      this.data.monthlyTrend;


    /*
     * REVENUE
     */

    this.revenueChartData = {

      labels:
        months.map(
          item =>
            item.label
        ),

      datasets: [
        {

          label:
            'Revenue',

          data:
            months.map(
              item =>
                Number(
                  item.revenue || 0
                )
            ),

          tension:
            0.35,

          fill:
            false

        }
      ]

    };


    /*
     * APPOINTMENTS
     */

    this.appointmentChartData = {

      labels:
        months.map(
          item =>
            item.label
        ),

      datasets: [

        {

          label:
            'Appointments',

          data:
            months.map(
              item =>
                item.appointments
            ),

          tension:
            0.35,

          fill:
            false

        },

        {

          label:
            'Completed',

          data:
            months.map(
              item =>
                item.completed
            ),

          tension:
            0.35,

          fill:
            false

        },

        {

          label:
            'Cancelled',

          data:
            months.map(
              item =>
                item.cancelled
            ),

          tension:
            0.35,

          fill:
            false

        }

      ]

    };


    /*
     * REVENUE BY THERAPIST
     */

    this.therapistRevenueChartData = {

      labels:
        this.data
          .therapistPerformance
          .map(
            therapist =>
              therapist.name
          ),

      datasets: [
        {

          label:
            'Revenue',

          data:
            this.data
              .therapistPerformance
              .map(
                therapist =>
                  Number(
                    therapist.revenue || 0
                  )
              )

        }
      ]

    };


    /*
     * APPOINTMENT STATUS
     */

    this.statusChartData = {

      labels: [
        'Scheduled',
        'Completed',
        'Cancelled'
      ],

      datasets: [
        {

          data: [

            this.data
              .status
              .scheduled,

            this.data
              .status
              .completed,

            this.data
              .status
              .cancelled

          ]

        }
      ]

    };


    /*
     * BUSIEST DAYS
     */

    this.busiestDaysChartData = {

      labels:
        this.data
          .busiestDays
          .map(
            item =>
              item.day
          ),

      datasets: [
        {

          label:
            'Appointments',

          data:
            this.data
              .busiestDays
              .map(
                item =>
                  item.appointments
              )

        }
      ]

    };

  }


  /*
   * =========================================
   * DATE RANGE
   * =========================================
   */

  getRange(): {
    from?: string;
    to?: string;
  } {

    if (
      this.period === 'all'
    ) {

      return {};

    }


    if (
      this.period === 'custom'
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


    /*
     * THIS MONTH
     */

    if (
      this.period === 'thisMonth'
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


    /*
     * LAST MONTH
     */

    if (
      this.period === 'lastMonth'
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


    /*
     * THIS YEAR
     */

    if (
      this.period === 'thisYear'
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


    /*
     * LAST 12 MONTHS
     */

    if (
      this.period === 'last12Months'
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


  /*
   * =========================================
   * FORMAT DATE
   * =========================================
   */

  private formatDate(
    date: Date
  ): string {

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      )
        .padStart(
          2,
          '0'
        );

    const day =
      String(
        date.getDate()
      )
        .padStart(
          2,
          '0'
        );

    return `${year}-${month}-${day}`;

  }


  /*
   * =========================================
   * FORMAT MONEY
   * =========================================
   */

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
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }
      )
      .format(
        Number(
          value || 0
        )
      );

  }


  /*
   * =========================================
   * FORMAT PERCENT
   * =========================================
   */

  percent(
    value:
      number |
      null |
      undefined
  ): string {

    return `${Number(
      value || 0
    ).toFixed(1)}%`;

  }

}