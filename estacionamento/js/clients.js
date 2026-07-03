// ===== CLIENTES =====
const Clients = {
    render() {
        return `
            <div class="dashboard-section fade-in">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                    <h2><i class="fas fa-users"></i> Clientes</h2>
                    <button class="btn btn-primary" onclick="Clients.showForm()">
                        <i class="fas fa-plus"></i> Novo Cliente
                    </button>
                </div>

                <div class="search-bar">
                    <input type="text" id="searchClient" placeholder="Buscar por nome, CPF ou RG..." onkeyup="Clients.filter()">
                    <button class="btn btn-outline" onclick="document.getElementById('searchClient').value=''; Clients.filter();">
                        <i class="fas fa-times"></i> Limpar
                    </button>
                </div>

                <div class="table-container">
                    <div class="table-header">
                        <h3><i class="fas fa-list"></i> Lista de Clientes</h3>
                        <span id="clientCount" style="color: var(--text-gray);">0 clientes</span>
                    </div>
                    <div id="clientList"></div>
                </div>
            </div>
        `;
    },

    init() {
        this.renderList();
    },

    renderList(filter = '') {
        let clients = DB.findAll('clients');
        
        if (filter) {
            const search = filter.toLowerCase();
            clients = clients.filter(c => 
                c.name.toLowerCase().includes(search) ||
                c.cpf.includes(search) ||
                c.rg.includes(search) ||
                c.email.toLowerCase().includes(search)
            );
        }

        const container = document.getElementById('clientList');
        document.getElementById('clientCount').textContent = `${clients.length} clientes`;

        if (clients.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>Nenhum cliente cadastrado</h3>
                    <p style="color: var(--text-gray);">Clique em "Novo Cliente" para adicionar</p>
                </div>
            `;
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>CPF</th>
                        <th>RG</th>
                        <th>Telefone</th>
                        <th>Email</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;

        clients.forEach(client => {
            html += `
                <tr>
                    <td><strong>${client.name}</strong></td>
                    <td>${client.cpf}</td>
                    <td>${client.rg}</td>
                    <td>${client.phone || '-'}</td>
                    <td>${client.email || '-'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary" onclick="Clients.showForm(${client.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="Clients.delete(${client.id})">
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
        const search = document.getElementById('searchClient').value;
        this.renderList(search);
    },

    showForm(id = null) {
        let client = null;
        let title = 'Novo Cliente';
        
        if (id) {
            client = DB.findById('clients', id);
            title = 'Editar Cliente';
        }

        const html = `
            <form id="clientForm" onsubmit="Clients.save(event)">
                <input type="hidden" id="clientId" value="${client ? client.id : ''}">
                
                <div class="form-group">
                    <label><i class="fas fa-user"></i> Nome Completo *</label>
                    <input type="text" id="clientName" value="${client ? client.name : ''}" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label><i class="fas fa-id-card"></i> CPF *</label>
                        <input type="text" id="clientCpf" value="${client ? client.cpf : ''}" placeholder="000.000.000-00" required>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-address-card"></i> RG *</label>
                        <input type="text" id="clientRg" value="${client ? client.rg : ''}" placeholder="00.000.000-0" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label><i class="fas fa-phone"></i> Telefone</label>
                        <input type="text" id="clientPhone" value="${client ? client.phone : ''}" placeholder="(00) 00000-0000">
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-envelope"></i> Email</label>
                        <input type="email" id="clientEmail" value="${client ? client.email : ''}" placeholder="email@exemplo.com">
                    </div>
                </div>
                
                <div class="form-group">
                    <label><i class="fas fa-calendar-alt"></i> Data de Nascimento</label>
                    <input type="date" id="clientBirth" value="${client ? client.birth_date : ''}">
                </div>
                
                <div class="form-group">
                    <label><i class="fas fa-home"></i> Endereço</label>
                    <input type="text" id="clientAddress" value="${client ? client.address : ''}" placeholder="Rua, número, bairro, cidade">
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
        
        const id = document.getElementById('clientId').value;
        const data = {
            name: document.getElementById('clientName').value.trim(),
            cpf: document.getElementById('clientCpf').value.trim(),
            rg: document.getElementById('clientRg').value.trim(),
            phone: document.getElementById('clientPhone').value.trim(),
            email: document.getElementById('clientEmail').value.trim(),
            birth_date: document.getElementById('clientBirth').value,
            address: document.getElementById('clientAddress').value.trim()
        };

        // Validações básicas
        if (!data.name || !data.cpf || !data.rg) {
            alert('Nome, CPF e RG são obrigatórios!');
            return;
        }

        // Verificar CPF duplicado
        const existing = DB.findBy('clients', 'cpf', data.cpf);
        if (existing.length > 0 && existing[0].id != id) {
            alert('CPF já cadastrado!');
            return;
        }

        // Verificar RG duplicado
        const existingRg = DB.findBy('clients', 'rg', data.rg);
        if (existingRg.length > 0 && existingRg[0].id != id) {
            alert('RG já cadastrado!');
            return;
        }

        if (id) {
            DB.update('clients', parseInt(id), data);
        } else {
            DB.insert('clients', data);
        }

        closeModal();
        this.renderList();
        this.init();
        
        // Atualizar dashboard se necessário
        if (window.app && window.app.currentSection === 'dashboard') {
            Dashboard.updateStats();
        }
    },

    delete(id) {
        if (!confirm('Deseja realmente excluir este cliente?')) return;
        
        // Verificar se cliente tem veículos
        const vehicles = DB.findBy('vehicles', 'client_id', id);
        if (vehicles.length > 0) {
            alert('Este cliente possui veículos cadastrados! Exclua os veículos primeiro.');
            return;
        }
        
        DB.delete('clients', id);
        this.renderList();
        this.init();
        
        if (window.app && window.app.currentSection === 'dashboard') {
            Dashboard.updateStats();
        }
    },

    // Gerar CPF/RG aleatórios
    generateCPF() {
        let cpf = '';
        for (let i = 0; i < 9; i++) {
            cpf += Math.floor(Math.random() * 10);
        }
        // Adicionar dígitos verificadores (simplificado)
        cpf += Math.floor(Math.random() * 10);
        cpf += Math.floor(Math.random() * 10);
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    },

    generateRG() {
        let rg = '';
        for (let i = 0; i < 8; i++) {
            rg += Math.floor(Math.random() * 10);
        }
        rg += Math.floor(Math.random() * 10);
        return rg.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
    }
};