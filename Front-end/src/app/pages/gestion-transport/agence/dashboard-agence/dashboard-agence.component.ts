import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VehiculeService } from '../../services/vehicule.service';
import { ReservationService } from '../../services/reservation.service';
import { Vehicule } from '../../models/vehicule.model';
import { Reservation } from '../../models/reservation.model';

@Component({
  selector: 'app-dashboard-agence',
  templateUrl: './dashboard-agence.component.html',
  styleUrls: ['./dashboard-agence.component.scss'],
})
export class DashboardAgenceComponent implements OnInit {
  breadCrumbItems = [
    { label: 'Transport' },
    { label: 'Agency', active: true },
    { label: 'Dashboard', active: true },
  ];
  public Math = Math;

  // Pagination properties
  itemsPerPage: number = 5;
  vehiclePage: number = 1;
  reservationPage: number = 1;
  pagedVehicles: Vehicule[] = [];
  pagedReservations: Reservation[] = [];

  currentUser: any;
  stats = {
    totalVehicles: { value: 0, change: 12.5 },
    availableVehicles: { value: 0, change: 8.3 },
    reservations: { value: 0, change: 5.2 },
    inMaintenance: { value: 0, change: -3.2 },
    pendingReservations: { value: 0, change: 0 },
    approvedReservations: { value: 0, change: 0 },
    rejectedReservations: { value: 0, change: 0 },
  };

  vehicleTypeChart: any;
  revenueChart: any;
  currentDate: Date = new Date();
  pendingReservationsChart: any;
  approvedReservationsChart: any;
  rejectedReservationsChart: any;

  // Vehicles data
  agencyVehicles: Vehicule[] = [];
  filteredVehicles: Vehicule[] = [];
  vehicleFilter: string = '';

  // Reservations data
  recentReservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  reservationFilter: string = '';

  loading = true;
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private vehiculeService: VehiculeService,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    this.currentUser = JSON.parse(localStorage.getItem('user')!);
    this.loadAgencyData();
    this.initReservationCharts();
  }

  private loadAgencyData(): void {
    if (!this.currentUser?.id) {
      this.errorMessage = 'User information incomplete. Please login again.';
      this.loading = false;
      this.router.navigate(['/login']);
      return;
    }

    this.loadDashboardData();
    this.initCharts();
  }

  private loadDashboardData(): void {
    this.loading = true;
    this.errorMessage = null;

    // Load agency vehicles
    this.vehiculeService.getVehiculesByAgence(this.currentUser.id).subscribe({
      next: (vehicles) => {
        this.agencyVehicles = vehicles;
        this.filteredVehicles = [...vehicles];
        this.vehiclePage = 1; // Reset to first page when data loads
        this.updatePagedVehicles();
        this.stats.totalVehicles.value = vehicles.length;
        this.stats.availableVehicles.value = vehicles.filter(
          (v) => v.disponible
        ).length;
        this.stats.inMaintenance.value = vehicles.filter(
          (v) => v.statut === 'MAINTENANCE'
        ).length;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load vehicles. Please try again later.';
        console.error('Vehicle loading error:', err);
      },
    });

    // Load reservations
    this.reservationService.getReservationsByAgence(this.currentUser.id).subscribe({
      next: (reservations) => {
        this.recentReservations = reservations;
        this.filteredReservations = [...reservations];
        this.reservationPage = 1; // Reset to first page
        this.updatePagedReservations();

          // Calculate reservation stats
          this.stats.reservations.value = reservations.length;
          this.stats.pendingReservations.value = reservations.filter(
            (r) => r.statut === 'EN_ATTENTE'
          ).length;
          this.stats.approvedReservations.value = reservations.filter(
            (r) => r.statut === 'APPROUVÉE'
          ).length;
          this.stats.rejectedReservations.value = reservations.filter(
            (r) => r.statut === 'REJETÉE'
          ).length;

          // Calculate percentage changes
          this.stats.pendingReservations.change = this.calculateRandomChange();
          this.stats.approvedReservations.change = this.calculateRandomChange();
          this.stats.rejectedReservations.change = this.calculateRandomChange();

          this.loading = false;
        },
        error: (err) => {
          this.errorMessage =
            'Failed to load reservations. Please try again later.';
          console.error('Reservation loading error:', err);
          this.loading = false;
        },
      });
  }

  // Ensure your updatePagedVehicles looks like this
  // Update your updatePagedVehicles method:
  private updatePagedVehicles(): void {
    const startItem = (this.vehiclePage - 1) * this.itemsPerPage;
    const endItem = this.vehiclePage * this.itemsPerPage;
    this.pagedVehicles = this.filteredVehicles.slice(startItem, endItem);
    console.log('Updating paged vehicles', {
      page: this.vehiclePage,
      itemsPerPage: this.itemsPerPage,
      totalItems: this.filteredVehicles.length,
      start: (this.vehiclePage - 1) * this.itemsPerPage,
      end: this.vehiclePage * this.itemsPerPage,
      resultCount: this.pagedVehicles.length,
    });
  }

  private updatePagedReservations(): void {
    const startItem = (this.reservationPage - 1) * this.itemsPerPage;
    const endItem = this.reservationPage * this.itemsPerPage;
    this.pagedReservations = this.filteredReservations.slice(startItem, endItem);
  }

  private calculateRandomChange(): number {
    return Math.floor(Math.random() * 10) - 2;
  }

  private initReservationCharts(): void {
    this._initPendingReservationsChart('["--tb-warning"]');
    this._initApprovedReservationsChart('["--tb-success"]');
    this._initRejectedReservationsChart('["--tb-danger"]');
  }

  private initCharts(): void {
    this.initVehicleTypeChart();
    this.initRevenueChart();
  }

  private initVehicleTypeChart(): void {
    this.vehiculeService
      .getVehiculesByAgence(this.currentUser.id)
      .subscribe((vehicles) => {
        const typeCounts = vehicles.reduce(
          (acc: Record<string, number>, vehicle) => {
            acc[vehicle.type] = (acc[vehicle.type] || 0) + 1;
            return acc;
          },
          {}
        );

        this.vehicleTypeChart = {
          tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
          legend: { top: '5%', left: 'center' },
          series: [
            {
              name: 'Vehicle Types',
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2,
              },
              label: { show: false, position: 'center' },
              emphasis: {
                label: { show: true, fontSize: '18', fontWeight: 'bold' },
              },
              labelLine: { show: false },
              data: Object.keys(typeCounts).map((type) => ({
                value: typeCounts[type],
                name: type,
              })),
              color: ['#3b5de7', '#45cb85', '#eeb902', '#ff715b', '#8f6ed5'],
            },
          ],
        };
      });
  }

  private initRevenueChart(): void {
    this.reservationService
      .getReservationsByAgence(this.currentUser.id)
      .subscribe((reservations) => {
        const monthlyRevenue = Array(12).fill(0);
        reservations.forEach((res) => {
          const date = new Date(res.debutLocation);
          const monthIndex = date.getMonth();
          monthlyRevenue[monthIndex] += res.prixTotal;
        });

        this.revenueChart = {
          series: [
            {
              name: 'Revenue',
              data: monthlyRevenue.map((val) => Math.round(val)),
            },
          ],
          chart: {
            height: 350,
            type: 'line',
            zoom: { enabled: false },
            toolbar: { show: false },
          },
          colors: ['#3b5de7'],
          dataLabels: { enabled: false },
          stroke: { curve: 'smooth', width: 3 },
          grid: { row: { colors: ['#f3f3f3', 'transparent'], opacity: 0.5 } },
          xaxis: {
            categories: [
              'Jan',
              'Feb',
              'Mar',
              'Apr',
              'May',
              'Jun',
              'Jul',
              'Aug',
              'Sep',
              'Oct',
              'Nov',
              'Dec',
            ],
          },
          tooltip: {
            enabled: true,
            y: { formatter: (val: number) => val.toLocaleString() + ' TND' },
          },
        };
      });
  }

  // Make sure filterVehicles resets the page
  filterVehicles(): void {
    if (!this.vehicleFilter) {
      this.filteredVehicles = [...this.agencyVehicles];
    } else {
      const searchText = this.vehicleFilter.toLowerCase();
      this.filteredVehicles = this.agencyVehicles.filter(
        (vehicle) =>
          vehicle.modele.toLowerCase().includes(searchText) ||
          vehicle.type.toLowerCase().includes(searchText) ||
          vehicle.prixParJour.toString().includes(searchText) ||
          vehicle.nbPlace.toString().includes(searchText)
      );
    }
    this.vehiclePage = 1; // Reset to first page when filtering
    this.updatePagedVehicles();
  }

  filterReservations(): void {
    if (!this.reservationFilter) {
      this.filteredReservations = [...this.recentReservations];
    } else {
      const searchText = this.reservationFilter.toLowerCase();
      this.filteredReservations = this.recentReservations.filter(
        (reservation) =>
          reservation.vehicule.modele.toLowerCase().includes(searchText) ||
          reservation.vehicule.type.toLowerCase().includes(searchText) ||
          reservation.fullName.toLowerCase().includes(searchText) ||
          reservation.prixTotal.toString().includes(searchText)
      );
    }
    this.reservationPage = 1; // Reset to first page when filtering
    this.updatePagedReservations();
  }

  // Add this method if not exists
  // Update your page change handler:
  onPageChange(event: any): void {
    this.vehiclePage = event.page;
    this.updatePagedVehicles();
  }
  onReservationPageChange(event: any): void {
    this.reservationPage = event.page;
    this.updatePagedReservations();
  }

  navigateToVehicles(): void {
    this.router.navigate([
      `/transportfront/agence/vehicules/list/agences/${this.currentUser.id}`,
    ]);
  }

  getVehicleStatusBadgeClass(vehicle: Vehicule): string {
    if (!vehicle.disponible) return 'danger';
    if (vehicle.statut === 'MAINTENANCE') return 'warning';
    return 'success';
  }

  getVehicleStatusText(vehicle: Vehicule): string {
    if (!vehicle.disponible) return 'Rented';
    if (vehicle.statut === 'MAINTENANCE') return 'In Maintenance';
    return 'Available';
  }

  getReservationStatusBadgeClass(reservation: Reservation): string {
    switch (reservation.statut) {
      case 'EN_ATTENTE':
        return 'warning';
      case 'APPROUVÉE':
        return 'success';
      case 'REJETÉE':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getReservationStatusText(status: string): string {
    switch (status) {
      case 'EN_ATTENTE':
        return 'Pending';
      case 'APPROUVÉE':
        return 'Approved';
      case 'REJETÉE':
        return 'Rejected';
      default:
        return status;
    }
  }

  deleteVehicle(vehicleId: number): void {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      this.vehiculeService.deleteVehicule(vehicleId).subscribe({
        next: () => {
          this.agencyVehicles = this.agencyVehicles.filter(
            (v) => v.id !== vehicleId
          );
          this.filteredVehicles = this.filteredVehicles.filter(
            (v) => v.id !== vehicleId
          );
          this.updatePagedVehicles();
          this.stats.totalVehicles.value = this.agencyVehicles.length;
          this.stats.availableVehicles.value = this.agencyVehicles.filter(
            (v) => v.disponible
          ).length;
          this.stats.inMaintenance.value = this.agencyVehicles.filter(
            (v) => v.statut === 'MAINTENANCE'
          ).length;
        },
        error: (err) => console.error('Error deleting vehicle:', err),
      });
    }
  }

  updateReservationStatus(
    reservationId: number,
    status: 'EN_ATTENTE' | 'APPROUVÉE' | 'REJETÉE'
  ): void {
    if (!reservationId) return;

    this.reservationService.updateStatut(reservationId, status).subscribe({
      next: () => {
        const reservation = this.recentReservations.find(
          (r) => r.id === reservationId
        );
        if (reservation) {
          reservation.statut = status;
        }
        this.filterReservations();

        // Update stats
        this.stats.pendingReservations.value = this.recentReservations.filter(
          (r) => r.statut === 'EN_ATTENTE'
        ).length;
        this.stats.approvedReservations.value = this.recentReservations.filter(
          (r) => r.statut === 'APPROUVÉE'
        ).length;
        this.stats.rejectedReservations.value = this.recentReservations.filter(
          (r) => r.statut === 'REJETÉE'
        ).length;
      },
      error: (err) => console.error('Error updating reservation:', err),
    });
  }

  private _initPendingReservationsChart(colors: any) {
    colors = this.getChartColorsArray(colors);
    this.pendingReservationsChart = {
      series: [
        {
          data: [32, 18, 29, 31, 46, 33, 39, 46],
        },
      ],
      chart: {
        type: 'line',
        height: 50,
        sparkline: {
          enabled: true,
        },
      },
      colors: colors,
      stroke: {
        curve: 'smooth',
        width: 1,
      },
      tooltip: {
        fixed: {
          enabled: false,
        },
        x: {
          show: false,
        },
        y: {
          title: {
            formatter: function (seriesName: any) {
              return '';
            },
          },
        },
        marker: {
          show: false,
        },
      },
    };
  }

  private _initApprovedReservationsChart(colors: any) {
    colors = this.getChartColorsArray(colors);
    this.approvedReservationsChart = {
      series: [
        {
          data: [25, 30, 35, 40, 45, 50, 55, 60],
        },
      ],
      chart: {
        type: 'line',
        height: 50,
        sparkline: {
          enabled: true,
        },
      },
      colors: colors,
      stroke: {
        curve: 'smooth',
        width: 1,
      },
      tooltip: {
        fixed: {
          enabled: false,
        },
        x: {
          show: false,
        },
        y: {
          title: {
            formatter: function (seriesName: any) {
              return '';
            },
          },
        },
        marker: {
          show: false,
        },
      },
    };
  }

  private _initRejectedReservationsChart(colors: any) {
    colors = this.getChartColorsArray(colors);
    this.rejectedReservationsChart = {
      series: [
        {
          data: [10, 12, 8, 15, 18, 20, 15, 12],
        },
      ],
      chart: {
        type: 'line',
        height: 50,
        sparkline: {
          enabled: true,
        },
      },
      colors: colors,
      stroke: {
        curve: 'smooth',
        width: 1,
      },
      tooltip: {
        fixed: {
          enabled: false,
        },
        x: {
          show: false,
        },
        y: {
          title: {
            formatter: function (seriesName: any) {
              return '';
            },
          },
        },
        marker: {
          show: false,
        },
      },
    };
  }

  private getChartColorsArray(colors: any) {
    colors = JSON.parse(colors);
    return colors.map(function (value: any) {
      var newValue = value.replace(' ', '');
      if (newValue.indexOf(',') === -1) {
        var color = getComputedStyle(document.documentElement).getPropertyValue(
          newValue
        );
        if (color) {
          color = color.replace(' ', '');
          return color;
        } else return newValue;
      } else {
        var val = value.split(',');
        if (val.length == 2) {
          var rgbaColor = getComputedStyle(
            document.documentElement
          ).getPropertyValue(val[0]);
          rgbaColor = 'rgba(' + rgbaColor + ',' + val[1] + ')';
          return rgbaColor;
        } else {
          return newValue;
        }
      }
    });
  }
  getFirstItemOnPage(): number {
    return (this.vehiclePage - 1) * this.itemsPerPage + 1;
  }

  getLastItemOnPage(): number {
    return Math.min(
      this.vehiclePage * this.itemsPerPage,
      this.filteredVehicles.length
    );
  }
}
