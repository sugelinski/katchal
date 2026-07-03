// ===== RELATÓRIOS =====
const Reports = {
    render() {
        return `
            <div class="dashboard-section fade-in">
                <h2 style="margin-bottom: 20px;"><i class="fas fa-file-alt"></i> Relatórios</h2>
                
                <div class="report-filters">
                    <div class="form-group">
                        <label><i class="fas fa-calendar-alt"></i> Período</label>
                        <select id="reportPeriod" onchange="Reports.generateReport()">
                            <option value="today">Hoje</option>
                            <option value="week">Esta Semana</option>
                            <option value="month">Este Mês</option>
                            <option value="year">Este Ano</option>
                            <option value="all">Todo Período</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-calendar-day"></i> Data Inicial</label>
                        <input type="date" id="reportStartDate" onchange="Reports.generateReport()">
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-calendar-day"></i> Data Final</label>
                        <input type="date" id="reportEndDate" onchange="Reports.generateReport()">
                    </div>
                    <div class="form-group" style="display: flex; align-items: flex-end;">
                        <button class="btn btn-primary" onclick="Reports.generateReport()">
                            <i class="fas fa-search"></i> Gerar
                        </button>
                    </div>
                </div>

                <div id="reportResults">
                    <div class="empty-state">
                        <i class="fas fa-file-alt"></i>
                        <h3>Selecione um período e clique em Gerar</h3>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        // Definir datas padrão (últimos 30 dias)
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        document.getElementById('reportStartDate').value = thirtyDaysAgo.toISOString().split('T')[0];
        document.getElementById('reportEndDate').value = today.toISOString().split('T')[0];
        
        // Gerar relatório automático
        this.generateReport();
    },

    generateReport() {
        const period = document.getElementById('reportPeriod').value;
        let startDate, endDate;
        const now = new Date();
        
        if (period === 'today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        } else if (period === 'week') {
            const day = now.getDay();
            startDate = new Date(now);
            startDate.setDate(now.getDate() - day);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 7);
        } else if (period === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        } else if (period === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear() + 1, 0, 1);
        } else {
            // Personalizado
            startDate = new Date(document.getElementById('reportStartDate').value);
            endDate = new Date(document.getElementById('reportEndDate').value);
            endDate.setDate(endDate.getDate() + 1);
        }

        // Filtrar registros
        const records = DB.findAll('parking_records');
        const filtered = records.filter(r => {
            if (!r.entry_time) return false;
            const entry = new Date(r.entry_time);
            return entry >= startDate && entry < endDate;
        });

        this.displayReport(filtered, startDate, endDate);
    },

    displayReport(records, startDate, endDate) {
        const container = document.getElementById('reportResults');

        if (records.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt"></i>
                    <h3>Nenhum registro encontrado neste período</h3>
                    <p style="color: var(--text-gray);">Tente selecionar outro período</p>
                </div>
            `;
            return;
        }

        // Estatísticas
        const totalEntries = records.length;
        const completed = records.filter(r => r.exit_time);
        const totalAmount = completed.reduce((sum, r) => sum + (r.amount || 0), 0);
        const avgDuration = completed.reduce((sum, r) => sum + (r.duration_minutes || 0), 0) / (completed.length || 1);
        const vehicleTypes = {};
        const dailyCount = {};

        // Analisar dados
        records.forEach(r => {
            const vehicle = DB.findById('vehicles', r.vehicle_id);
            const type = vehicle ? vehicle.type : 'Desconhecido';
            vehicleTypes[type] = (vehicleTypes[type] || 0) + 1;
            
            if (r.entry_time) {
                const date = r.entry_time.split(' ')[0];
                dailyCount[date] = (dailyCount[date] || 0) + 1;
            }
        });

        // Gerar relatório
        let html = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
                <div class="stat-card">
                    <div class="icon"><i class="fas fa-sign-in-alt"></i></div>
                    <div class="value">${totalEntries}</div>
                    <div class="label">Total de Entradas</div>
                </div>
                <div class="stat-card">
                    <div class="icon"><i class="fas fa-sign-out-alt"></i></div>
                    <div class="value">${completed.length}</div>
                    <div class="label">Saídas Realizadas</div>
                </div>
                <div class="stat-card">
                    <div class="icon"><i class="fas fa-money-bill-wave"></i></div>
                    <div class="value">R$ ${totalAmount.toFixed(2)}</div>
                    <div class="label">Faturamento Total</div>
                </div>
                <div class="stat-card">
                    <div class="icon"><i class="fas fa-clock"></i></div>
                    <div class="value">${Math.round(avgDuration / 60)}h</div>
                    <div class="label">Média de Permanência</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                <div class="table-container">
                    <div class="table-header">
                        <h3><i class="fas fa-chart-bar"></i> Por Tipo de Veículo</h3>
                    </div>
                    <div style="padding: 15px;">
                        <table>
                            <thead>
                                <tr><th>Tipo</th><th>Quantidade</th><th>%</th></tr>
                            </thead>
                            <tbody>
        `;

        const total = records.length;
        Object.entries(vehicleTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
            const percent = ((count / total) * 100).toFixed(1);
            html += `<tr><td>${type}</td><td>${count}</td><td>${percent}%</td></tr>`;
        });

        html += `
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="table-container">
                    <div class="table-header">
                        <h3><i class="fas fa-calendar-day"></i> Movimento por Dia</h3>
                    </div>
                    <div style="padding: 15px; max-height: 250px; overflow-y: auto;">
                        <table>
                            <thead>
                                <tr><th>Data</th><th>Entradas</th></tr>
                            </thead>
                            <tbody>
        `;

        Object.entries(dailyCount).sort((a, b) => a[0].localeCompare(b[0])).forEach(([date, count]) => {
            html += `<tr><td>${date}</td><td>${count}</td></tr>`;
        });

        html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="table-container">
                <div class="table-header">
                    <h3><i class="fas fa-list"></i> Registros Detalhados</h3>
                    <span style="color: var(--text-gray);">${records.length} registros</span>
                </div>
                <div style="padding: 15px; max-height: 400px; overflow-y: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>Entrada</th>
                                <th>Saída</th>
                                <th>Veículo</th>
                                <th>Vaga</th>
                                <th>Duração</th>
                                <th>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        records.slice().reverse().forEach(r => {
            const vehicle = DB.findById('vehicles', r.vehicle_id);
            const spot = DB.findById('parking_spots', r.spot_id);
            const duration = r.duration_minutes ? 
                `${Math.floor(r.duration_minutes / 60)}h ${r.duration_minutes % 60}min` : 
                'Em andamento';

            html += `
                <tr>
                    <td>${r.entry_time || 'N/A'}</td>
                    <td>${r.exit_time || 'Em andamento'}</td>
                    <td>${vehicle ? vehicle.plate : 'N/A'}</td>
                    <td>${spot ? spot.number : 'N/A'}</td>
                    <td>${duration}</td>
                    <td>${r.amount ? `R$ ${r.amount.toFixed(2)}` : 'N/A'}</td>
                </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                </div>
            </div>

            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn btn-primary" onclick="Reports.exportReport()">
                    <i class="fas fa-file-export"></i> Exportar CSV
                </button>
                <button class="btn btn-success" onclick="Reports.printReport()">
                    <i class="fas fa-print"></i> Imprimir
                </button>
            </div>
        `;

        container.innerHTML = html;
    },

    exportReport() {
        const records = DB.findAll('parking_records');
        if (records.length === 0) {
            alert('Não há registros para exportar!');
            return;
        }

        let csv = 'ID,Veículo,Placa,Vaga,Entrada,Saída,Duração,Valor,Status\n';
        const vehicles = DB.findAll('vehicles');
        const spots = DB.findAll('parking_spots');

        records.forEach(r => {
            const vehicle = vehicles.find(v => v.id === r.vehicle_id);
            const spot = spots.find(s => s.id === r.spot_id);
            const duration = r.duration_minutes || 0;
            
            csv += `${r.id},"${vehicle ? vehicle.model : 'N/A'}","${vehicle ? vehicle.plate : 'N/A'}",`;
            csv += `"${spot ? spot.number : 'N/A'}",${r.entry_time || ''},${r.exit_time || ''},`;
            csv += `${Math.floor(duration/60)}h${duration%60}min,${r.amount || ''},${r.payment_status || ''}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_estacionamento_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    },

    printReport() {
        window.print();
    }
};