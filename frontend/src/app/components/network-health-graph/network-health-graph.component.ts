import { Component, Input, OnInit, OnChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexYAxis,
  ApexTitleSubtitle,
  ApexLegend,
  ApexFill,
  NgApexchartsModule,
  ApexTooltip,
  ApexGrid
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  yaxis: ApexYAxis;
  title: ApexTitleSubtitle;
  labels: string[];
  legend: ApexLegend;
  subtitle: ApexTitleSubtitle;
  fill: ApexFill;
  tooltip: ApexTooltip;
  colors: string[];
  grid: ApexGrid;
};

@Component({
  selector: 'app-network-health-graph',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './network-health-graph.component.html',
  styleUrls: ['./network-health-graph.component.css']
})
export class NetworkHealthGraphComponent implements OnInit, OnChanges {
  @Input() data: any[] = [];
  @Input() metric: 'bandwidth' | 'latency' | 'packet_loss' | 'uptime' = 'bandwidth';
  @Input() height: number = 300;

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions> | any;

  // Stats for the side
  maxValue: number = 0;
  minValue: number = 0;
  pointsCount: number = 0;

  constructor() {
    this.initChart();
  }

  ngOnInit() {
    if (this.data && this.data.length > 0) {
      this.updateGraph();
    } else {
      this.generateDemoData();
    }
  }

  ngOnChanges() {
    if (this.data && this.data.length > 0) {
      this.updateGraph();
    } else {
      this.generateDemoData();
    }
  }

  initChart() {
    const color = this.getMetricColor();

    this.chartOptions = {
      series: [
        {
          name: this.getMetricLabel(),
          data: []
        }
      ],
      chart: {
        type: 'area',
        height: this.height,
        background: 'transparent',
        fontFamily: 'inherit',
        toolbar: {
          show: false // Hide menu bars for a cleaner widget look
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        }
      },
      colors: [color], // Dynamic color
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 90, 100]
        }
      },
      dataLabels: {
        enabled: false // Disable direct text dots inside the chart for a minimalistic feel
      },
      stroke: {
        curve: 'smooth', // Smooth out the area path curves perfectly
        width: 3
      },
      xaxis: {
        type: 'category',
        categories: [],
        labels: {
          style: {
            colors: '#9ca3af',
            fontSize: '11px'
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        tooltip: {
          enabled: false
        }
      },
      yaxis: {
        labels: {
          formatter: (value: number) => {
            return value.toFixed(1);
          },
          style: {
            colors: '#9ca3af',
            fontSize: '11px'
          }
        }
      },
      grid: {
        borderColor: 'rgba(255,255,255,0.05)',
        strokeDashArray: 4,
        yaxis: {
          lines: {
            show: true
          }
        },
        xaxis: {
          lines: {
            show: false
          }
        }
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (val: number) => val.toFixed(2)
        }
      }
    };
  }

  updateGraph() {
    this.extractDataPoints();
  }

  generateDemoData() {
    const ranges = {
      bandwidth: { min: 50, max: 100 },
      latency: { min: 10, max: 50 },
      packet_loss: { min: 0, max: 5 },
      uptime: { min: 95, max: 100 }
    };

    const range = ranges[this.metric];
    const demoData = Array.from({ length: 20 }, (_, index) => {
      const d = new Date();
      d.setMinutes(d.getMinutes() - (19 - index) * 5);
      return {
        y: Math.random() * (range.max - range.min) + range.min,
        timeLabel: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    });

    this.renderChart(
      demoData.map(d => d.timeLabel),
      demoData.map(d => d.y)
    );
  }

  extractDataPoints() {
    const categories: string[] = [];
    const seriesData: number[] = [];

    this.data.forEach((record: any) => {
      let val = 0;
      if (record.deviceId !== undefined) {
        switch (this.metric) {
          case 'bandwidth':
            val = parseFloat(record.downloadMbps || 0) + parseFloat(record.uploadMbps || 0); break;
          case 'latency':
            val = parseFloat(record.latencyMs || 0); break;
          case 'packet_loss':
            val = parseFloat(record.packetLoss || 0); break;
          case 'uptime':
            val = record.uptimeStatus === 'online' ? 100 : 0; break;
        }
      } else {
        const metrics = record.metrics;
        switch (this.metric) {
          case 'bandwidth':
            val = (metrics?.bandwidth?.download_mbps || 0) + (metrics?.bandwidth?.upload_mbps || 0); break;
          case 'latency':
            val = metrics?.latency_ms || 0; break;
          case 'packet_loss':
            val = metrics?.packet_loss_percent || 0; break;
          case 'uptime':
            val = metrics?.uptime_percent || 0; break;
        }
      }

      let dateObj = record.timestamp ? new Date(record.timestamp) : new Date();
      categories.push(dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      seriesData.push(val);
    });

    this.renderChart(categories, seriesData);
  }

  renderChart(categories: string[], data: number[]) {
    this.pointsCount = data.length;
    if (data.length > 0) {
      this.maxValue = Math.max(...data);
      this.minValue = Math.min(...data);
    } else {
      this.maxValue = 0;
      this.minValue = 0;
    }

    const color = this.getMetricColor();

    if (this.chart) {
      this.chart.updateOptions({
        xaxis: {
          categories: categories
        },
        colors: [color],
        series: [{
          name: this.getMetricLabel(),
          data: data
        }]
      });
    } else {
      this.chartOptions.xaxis.categories = categories;
      this.chartOptions.series[0].data = data;
      this.chartOptions.colors = [color];
    }
  }

  getMetricLabel(): string {
    const labels = {
      bandwidth: 'Bandwidth (Mbps)',
      latency: 'Latency (ms)',
      packet_loss: 'Packet Loss (%)',
      uptime: 'Uptime (%)'
    };
    return labels[this.metric];
  }

  getMetricColor(): string {
    const colors = {
      bandwidth: '#667eea',
      latency: '#f2c94c',
      packet_loss: '#f45c43',
      uptime: '#38ef7d'
    };
    return colors[this.metric];
  }
}
