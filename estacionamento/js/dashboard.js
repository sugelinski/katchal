// ===== DASHBOARD =====
const Dashboard = {
    render() {
        return `
            <div class="dashboard-section fade-in">
                <h2 style="margin-bottom: 20px; color: var(--text-light);">
                    <i class="fas fa-chart-pie"></i> Dashboard
                </h2>
                
                <div class="dashboard-grid">
                    <div class="stat-card">
                        <div class="icon"><i class="fas fa-car"></i></div>
                        <div class="value" id="totalVehicles">0</div>
                        <div class="label">Total de Veículos</div>
                    </div>
                    <div class="stat-card">
                        <div class="icon"><i class="fas fa-users"></i></div>
                        <div class="value" id="totalClients">0</div>
                        <div class="label">Total de Clientes</div>
                    </div>
                    <div class="stat-card">
                        <div class="icon"><i class="fas fa-parking"></i></div>
                        <div class="value" id="occupiedSpots">0</div>
                        <div class="label">Vagas Ocupadas</div>
                    </div>
                    <div class="stat-card">
                        <div class="icon"><i class="fas fa-clock"></i></div>
                        <div class="value" id="todayRecords">0</div>
                        <div class="label">Entradas Hoje</div>
                    </div>
                </div>

                <div class="table-container">
                    <div class="table-header">
                        <h3><i class="fas fa-clock"></i> Últimos Registros</h3>
                    </div>
                    <div id="recentRecords">
                        <div class="empty-state">
                            <i class="fas fa-clock"></i>
                            <h3>Nenhum registro recente</h3>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 20px;">
                    <h3 style="margin-bottom: 15px;"><i class="fas fa-parking"></i> Mapa de Vagas</h3>
                    <div class="parking-spots" id="parkingMap"></div>
                </div>
            </div>
        `;
    },

    init() {
        this.updateStats();
        this.updateRecentRecords();
        this.updateParkingMap();
    },

    updateStats() {
        const vehicles = DB.findAll('vehicles');
        const clients = DB.findAll('clients');
        const spots = DB.findAll('parking_spots');
        const records = DB.findAll('parking_records');
        
        const occupied = spots.filter(s => s.status === 'Ocupado').length;
        const today = new Date().toISOString().split('T')[0];
        const todayRecords = records.filter(r => r.entry_time && r.entry_time.startsWith(today));

        document.getElementById('totalVehicles').textContent = vehicles.length;
        document.getElementById('totalClients').textContent = clients.length;
        document.getElementById('occupiedSpots').textContent = occupied;
        document.getElementById('todayRecords').textContent = todayRecords.length;
    },

    updateRecentRecords() {
        const records = DB.findAll('parking_records');
        const vehicles = DB.findAll('vehicles');
        const spots = DB.findAll('parking_spots');
        const clients = DB.findAll('clients');
        
        const recent = records.slice(-5).reverse();
        const container = document.getElementById('recentRecords');
        
        if (recent.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <h3>Nenhum registro recente</h3>
                </div>
            `;
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Veículo</th>
                        <th>Vaga</th>
                        <th>Cliente</th>
                        <th>Entrada</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        recent.forEach(record => {
            const vehicle = vehicles.find(v => v.id === record.vehicle_id);
            const spot = spots.find(s => s.id === record.spot_id);
            const client = clients.find(c => c.id === record.client_id);
            
            const status = record.exit_time ? 
                '<span class="badge badge-success">Finalizado</span>' : 
                '<span class="badge badge-warning">Ativo</span>';

            html += `
                <tr>
                    <td>${vehicle ? vehicle.plate + ' - ' + vehicle.model : 'N/A'}</td>
                    <td>${spot ? spot.number : 'N/A'}</td>
                    <td>${client ? client.name : 'Visitante'}</td>
                    <td>${record.entry_time || 'N/A'}</td>
                    <td>${status}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    },

    updateParkingMap() {
        const spots = DB.findAll('parking_spots');
        const container = document.getElementById('parkingMap');
        
        if (spots.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhuma vaga cadastrada</div>';
            return;
        }

        let html = '';
        spots.forEach(spot => {
            const isOccupied = spot.status === 'Ocupado';
            const statusClass = isOccupied ? 'occupied' : 'available';
            const statusText = isOccupied ? 'Ocupada' : 'Livre';
            
            html += `
                <div class="spot ${statusClass}" onclick="Parking.showSpotDetails(${spot.id})" title="Vaga ${spot.number} - ${spot.type}">
                    <span class="spot-number">${spot.number}</span>
                    <span class="spot-status">${statusText}</span>
                    <span style="font-size: 8px; color: var(--text-gray);">${spot.type}</span>
                </div>
            `;
        });

        container.innerHTML = html;
    }
};