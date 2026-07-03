// ===== ESTACIONAMENTO =====
const Parking = {
    render() {
        return `
            <div class="dashboard-section fade-in">
                <h2 style="margin-bottom: 20px;"><i class="fas fa-parking"></i> Gerenciar Estacionamento</h2>
                
                <div class="table-container" style="margin-bottom: 20px;">
                    <div class="table-header">
                        <h3><i class="fas fa-map"></i> Mapa de Vagas</h3>
                        <div style="display: flex; gap: 15px; font-size: 13px;">
                            <span><span class="badge badge-success">●</span> Livre</span>
                            <span><span class="badge badge-danger">●</span> Ocupada</span>
                            <span><span class="badge badge-warning">●</span> Preferencial</span>
                        </div>
                    </div>
                    <div style="padding: 20px;">
                        <div class="parking-spots" id="parkingMapFull"></div>
                    </div>
                </div>

                <div class="table-container">
                    <div class="table-header">
                        <h3><i class="fas fa-clock"></i> Registros Ativos</h3>
                        <button class="btn btn-sm btn-success" onclick="Parking.showCheckInForm()">
                            <i class="fas fa-sign-in-alt"></i> Nova Entrada
                        </button>
                    </div>
                    <div id="activeRecords"></div>
                </div>

                <div class="table-container" style="margin-top: 20px;">
                    <div class="table-header">
                        <h3><i class="fas fa-history"></i> Histórico Completo</h3>
                        <button class="btn btn-sm btn-outline" onclick="Parking.renderHistory()">
                            <i class="fas fa-sync"></i> Atualizar
                        </button>
                    </div>
                    <div id="historyRecords"></div>
                </div>
            </div>
        `;
    },

    init() {
        this.renderMap();
        this.renderActiveRecords();
        this.renderHistory();
    },

    renderMap() {
        const spots = DB.findAll('parking_spots');
        const container = document.getElementById('parkingMapFull');
        
        let html = '';
        spots.forEach(spot => {
            const isOccupied = spot.status === 'Ocupado';
            const isPreferential = spot.type === 'Preferencial';
            const isVIP = spot.type === 'VIP';
            const statusClass = isOccupied ? 'occupied' : 'available';
            const typeClass = isPreferential ? 'preferential' : '';
            
            html += `
                <div class="spot ${statusClass} ${typeClass}" onclick="Parking.showSpotDetails(${spot.id})" 
                     style="${isPreferential ? 'border-color: var(--warning);' : ''} ${isVIP ? 'border-color: var(--info);' : ''}">
                    <span class="spot-number">${spot.number}</span>
                    <span class="spot-status">${isOccupied ? 'Ocupada' : 'Livre'}</span>
                    <span style="font-size: 8px; color: var(--text-gray);">${spot.type}</span>
                    ${isOccupied ? `<span style="font-size: 7px; margin-top: 2px;">👤 ${this.getVehicleOwner(spot.vehicle_id)}</span>` : ''}
                </div>
            `;
        });

        container.innerHTML = html;
    },

    getVehicleOwner(vehicleId) {
        if (!vehicleId) return '';
        const vehicle = DB.findById('vehicles', vehicleId);
        if (!vehicle) return '';
        const client = DB.findById('clients', vehicle.client_id);
        return client ? client.name.split(' ')[0] : 'Visitante';
    },

    renderActiveRecords() {
        const records = DB.findAll('parking_records');
        const active = records.filter(r => !r.exit_time);
        const container = document.getElementById('activeRecords');

        if (active.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-parking"></i>
                    <h3>Nenhum veículo estacionado</h3>
                </div>
            `;
            return;
        }

        const vehicles = DB.findAll('vehicles');
        const spots = DB.findAll('parking_spots');
        const clients = DB.findAll('clients');

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Vaga</th>
                        <th>Veículo</th>
                        <th>Proprietário</th>
                        <th>Entrada</th>
                        <th>Duração</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;

        active.forEach(record => {
            const vehicle = vehicles.find(v => v.id === record.vehicle_id);
            const spot = spots.find(s => s.id === record.spot_id);
            const client = clients.find(c => c.id === record.client_id);
            
            const duration = this.calculateDuration(record.entry_time);

            html += `
                <tr>
                    <td><strong>${spot ? spot.number : 'N/A'}</strong></td>
                    <td>${vehicle ? `${vehicle.plate} - ${vehicle.model}` : 'N/A'}</td>
                    <td>${client ? client.name : 'Visitante'}</td>
                    <td>${record.entry_time || 'N/A'}</td>
                    <td>${duration}</td>
                    <td>
                        <button class="btn btn-sm btn-success" onclick="Parking.checkOut(${record.id})">
                            <i class="fas fa-sign-out-alt"></i> Saída
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    },

    renderHistory() {
        const records = DB.findAll('parking_records');
        const container = document.getElementById('historyRecords');

        if (records.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>Nenhum registro no histórico</h3>
                </div>
            `;
            return;
        }

        const vehicles = DB.findAll('vehicles');
        const spots = DB.findAll('parking_spots');
        const clients = DB.findAll('clients');

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Vaga</th>
                        <th>Veículo</th>
                        <th>Proprietário</th>
                        <th>Entrada</th>
                        <th>Saída</th>
                        <th>Duração</th>
                        <th>Valor</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        const sorted = [...records].reverse().slice(0, 20);
        sorted.forEach(record => {
            const vehicle = vehicles.find(v => v.id === record.vehicle_id);
            const spot = spots.find(s => s.id === record.spot_id);
            const client = clients.find(c => c.id === record.client_id);
            
            const duration = record.duration_minutes ? 
                `${Math.floor(record.duration_minutes / 60)}h ${record.duration_minutes % 60}min` : 
                'N/A';

            const status = record.payment_status === 'Pago' ? 
                '<span class="badge badge-success">Pago</span>' : 
                '<span class="badge badge-warning">Pendente</span>';

            html += `
                <tr>
                    <td>${spot ? spot.number : 'N/A'}</td>
                    <td>${vehicle ? vehicle.plate : 'N/A'}</td>
                    <td>${client ? client.name : 'Visitante'}</td>
                    <td>${record.entry_time || 'N/A'}</td>
                    <td>${record.exit_time || 'N/A'}</td>
                    <td>${duration}</td>
                    <td>${record.amount ? `R$ ${record.amount.toFixed(2)}` : 'N/A'}</td>
                    <td>${status}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    },

    calculateDuration(entryTime) {
        if (!entryTime) return 'N/A';
        const entry = new Date(entryTime);
        const now = new Date();
        const diff = Math.floor((now - entry) / 60000); // minutos
        
        if (diff < 60) return `${diff} min`;
        const hours = Math.floor(diff / 60);
       