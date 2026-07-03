// ===== VEÍCULOS =====
const Vehicles = {
    render() {
        return `
            <div class="dashboard-section fade-in">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                    <h2><i class="fas fa-car"></i> Veículos</h2>
                    <button class="btn btn-primary" onclick="Vehicles.showForm()">
                        <i class="fas fa-plus"></i> Novo Veículo
                    </button>
                </div>

                <div class="search-bar">
                    <input type="text" id="searchVehicle" placeholder="Buscar por placa, modelo, marca..." onkeyup="Vehicles.filter()">
                    <select id="filterVehicleType" onchange="Vehicles.filter()">
                        <option value="">Todos os tipos</option>
                        <option value="Carro">Carro</option>
                        <option value="Moto">Moto</option>
                        <option value="Caminhão">Caminhão</option>
                        <option value="Van">Van</option>
                        <option value="SUV">SUV</option>
                    </select>
                    <button class="btn btn-outline" onclick="document.getElementById('searchVehicle').value=''; document.getElementById('filterVehicleType').value=''; Vehicles.filter();">
                        <i class="fas fa-times"></i> Limpar
                    </button>
                </div>

                <div class="table-container">
                    <div class="table-header">
                        <h3><i class="fas fa-list"></i> Lista de Veículos</h3>
                        <span id="vehicleCount" style="color: var(--text-gray);">0 veículos</span>
                    </div>
                    <div id="vehicleList"></div>
                </div>
            </div>
        `;
    },

    init() {
        this.renderList();
    },

    renderList(filter = '', typeFilter = '') {
        let vehicles = DB.findAll('vehicles');
        const clients = DB.findAll('clients');
        
        if (filter) {
            const search = filter.toLowerCase();
            vehicles = vehicles.filter(v => 
                v.plate.toLowerCase().includes(search) ||
                v.model.toLowerCase().includes(search) ||
                v.brand.toLowerCase().includes(search) ||
                v.color.toLowerCase().includes(search)
            );
        }

        if (typeFilter) {
            vehicles = vehicles.filter(v => v.type === typeFilter);
        }

        const container = document.getElementById('vehicleList');
        document.getElementById('vehicleCount').textContent = `${vehicles.length} veículos`;

        if (vehicles.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-car"></i>
                    <h3>Nenhum veículo cadastrado</h3>
                    <p style="color: var(--text-gray);">Clique em "Novo Veículo" para adicionar</p>
                </div>
            `;
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Placa</th>
                        <th>Marca/Modelo</th>
                        <th>Cor</th>
                        <th>Ano</th>
                        <th>Tipo</th>
                        <th>Proprietário</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;

        vehicles.forEach(vehicle => {
            const client = clients.find(c => c.id === vehicle.client_id);
            
            html += `
                <tr>
                    <td><strong>${vehicle.plate}</strong></td>
                    <td>${vehicle.brand} ${vehicle.model}</td>
                    <td>${vehicle.color}</td>
                    <td>${vehicle.year}</td>
                    <td><span class="badge badge-info">${vehicle.type}</span></td>
                    <td>${client ? client.name : 'Visitante'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary" onclick="Vehicles.showForm(${vehicle.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="Vehicles.delete(${vehicle.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    },

    filter() {
        const search = document.getElementById('searchVehicle').value;
        const type = document.getElementById('filterVehicleType').value;
        this.renderList(search, type);
    },

    showForm(id = null) {
        let vehicle = null;
        let title = 'Novo Veículo';
        const clients = DB.findAll('clients');
        
        if (id) {
            vehicle = DB.findById('vehicles', id);
            title = 'Editar Veículo';
        }

        let clientOptions = '<option value="">Sem proprietário (Visitante)</option>';
        clients.forEach(c => {
            const selected = vehicle && vehicle.client_id === c.id ? 'selected' : '';
            clientOptions += `<option value="${c.id}" ${selected}>${c.name} - ${c.cpf}</option>`;
        });

        const html = `
            <form id="vehicleForm" onsubmit="Vehicles.save(event)">
                <input type="hidden" id="vehicleId" value="${vehicle ? vehicle.id : ''}">
                
                <div class="form-row">
                    <div class="form-group">
                        <label><i class="fas fa-license-plate"></i> Placa *</label>
                        <input type="text" id="vehiclePlate" value="${vehicle ? vehicle.plate : ''}" placeholder="ABC-1234" required>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-calendar-alt"></i> Ano *</label>
                        <input type="number" id="vehicleYear" value="${vehicle ? vehicle.year : ''}" placeholder="2020" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label><i class="fas fa-car"></i> Marca *</label>
                        <input type="text" id="vehicleBrand" value="${vehicle ? vehicle.brand : ''}" placeholder="Toyota" required>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-car-side"></i> Modelo *</label>
                        <input type="text" id="vehicleModel" value="${vehicle ? vehicle.model : ''}" placeholder="Corolla" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label><i class="fas fa-palette"></i> Cor *</label>
                        <input type="text" id="vehicleColor" value="${vehicle ? vehicle.color : ''}" placeholder="Prata" required>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-arrows-alt"></i> Tamanho</label>
                        <select id="vehicleSize">
                            <option value="Pequeno" ${vehicle && vehicle.size === 'Pequeno' ? 'selected' : ''}>Pequeno</option>
                            <option value="Médio" ${vehicle && vehicle.size === 'Médio' ? 'selected' : ''}>Médio</option>
                            <option value="Grande" ${vehicle && vehicle.size === 'Grande' ? 'selected' : ''}>Grande</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label><i class="fas fa-tag"></i> Tipo *</label>
                        <select id="vehicleType" required>
                            <option value="Carro" ${vehicle && vehicle.type === 'Carro' ? 'selected' : ''}>Carro</option>
                            <option value="Moto" ${vehicle && vehicle.type === 'Moto' ? 'selected' : ''}>Moto</option>
                            <option value="Caminhão" ${vehicle && vehicle.type === 'Caminhão' ? 'selected' : ''}>Caminhão</option>
                            <option value="Van" ${vehicle && vehicle.type === 'Van' ? 'selected' : ''}>Van</option>
                            <option value="SUV" ${vehicle && vehicle.type === 'SUV' ? 'selected' : ''}>SUV</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-user"></i> Proprietário</label>
                        <select id="vehicleClient">
                            ${clientOptions}
                        </select>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Salvar
                    </button>
                </div>
            </form>
        `;

        openModal(title, html);
    },

    save(event) {
        event.preventDefault();
        
        const id = document.getElementById('vehicleId').value;
        const data = {
            plate: document.getElementById('vehiclePlate').value.trim().toUpperCase(),
            brand: document.getElementById('vehicleBrand').value.trim(),
            model: document.getElementById('vehicleModel').value.trim(),
            color: document.getElementById('vehicleColor').value.trim(),
            year: parseInt(document.getElementById('vehicleYear').value),
            size: document.getElementById('vehicleSize').value,
            type: document.getElementById('vehicleType').value,
            client_id: document.getElementById('vehicleClient').value ? parseInt(document.getElementById('vehicleClient').value) : null
        };

        // Validações
        if (!data.plate || !data.brand || !data.model || !data.color || !data.year || !data.type) {
            alert('Todos os campos obrigatórios devem ser preenchidos!');
            return;
        }

        // Verificar placa duplicada
        const existing = DB.findBy('vehicles', 'plate', data.plate);
        if (existing.length > 0 && existing[0].id != id) {
            alert('Placa já cadastrada!');
            return;
        }

        if (id) {
            DB.update('vehicles', parseInt(id), data);
        } else {
            DB.insert('vehicles', data);
        }

        closeModal();
        this.renderList();
        this.init();
        
        if (window.app && window.app.currentSection === 'dashboard') {
            Dashboard.updateStats();
        }
    },

    delete(id) {
        if (!confirm('Deseja realmente excluir este veículo?')) return;
        
        // Verificar se veículo está estacionado
        const spots = DB.findBy('parking_spots', 'vehicle_id', id);
        if (spots.some(s => s.status === 'Ocupado')) {
            alert('Este veículo está estacionado! Finalize o estacionamento primeiro.');
            return;
        }
        
        DB.delete('vehicles', id);
        this.renderList();
        this.init();
        
        if (window.app && window.app.currentSection === 'dashboard') {
            Dashboard.updateStats();
        }
    }
};