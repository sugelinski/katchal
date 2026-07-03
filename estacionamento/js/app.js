// ===== APP PRINCIPAL =====
class App {
    constructor() {
        this.currentSection = 'dashboard';
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupLogout();
        this.loadSection('dashboard');
        this.updateUserName();
    }

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = item.dataset.section;
                this.loadSection(section);
                
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    setupLogout() {
        document.getElementById('logoutBtn').addEventListener('click', () => {
            if (confirm('Deseja realmente sair?')) {
                Auth.logout();
            }
        });
    }

    updateUserName() {
        const user = Auth.getUser();
        if (user) {
            document.getElementById('userName').textContent = user.name || user.username;
        }
    }

    loadSection(section) {
        this.currentSection = section;
        const contentArea = document.getElementById('contentArea');
        
        switch(section) {
            case 'dashboard':
                contentArea.innerHTML = Dashboard.render();
                Dashboard.init();
                break;
            case 'clients':
                contentArea.innerHTML = Clients.render();
                Clients.init();
                break;
            case 'vehicles':
                contentArea.innerHTML = Vehicles.render();
                Vehicles.init();
                break;
            case 'parking':
                contentArea.innerHTML = Parking.render();
                Parking.init();
                break;
            case 'reports':
                contentArea.innerHTML = Reports.render();
                Reports.init();
                break;
            default:
                contentArea.innerHTML = '<h2>Página não encontrada</h2>';
        }
    }
}

// ===== MODAL GLOBAL =====
function openModal(title, bodyHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

// Fechar modal ao clicar fora
document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
       