// ===== AUTH SYSTEM =====
const Auth = {
    currentUser: null,
    
    // Verificar se está logado
    isAuthenticated() {
        const token = localStorage.getItem('parking_token');
        if (!token) return false;
        
        try {
            const userData = JSON.parse(atob(token));
            this.currentUser = userData;
            return true;
        } catch {
            return false;
        }
    },
    
    // Login
    login(username, password) {
        const users = DB.findAll('users');
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            // Salvar token (simulado)
            const tokenData = { id: user.id, username: user.username, name: user.name, role: user.role };
            const token = btoa(JSON.stringify(tokenData));
            localStorage.setItem('parking_token', token);
            this.currentUser = tokenData;
            return { success: true, user: tokenData };
        }
        
        return { success: false, message: 'Usuário ou senha inválidos!' };
    },
    
    // Logout
    logout() {
        localStorage.removeItem('parking_token');
        this.currentUser = null;
        window.location.reload();
    },
    
    // Obter usuário atual
    getUser() {
        if (!this.currentUser) {
            this.isAuthenticated();
        }
        return this.currentUser;
    },
    
    // Verificar se é admin
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    }
};

// ===== LOGIN FORM =====
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const result = Auth.login(username, password);
    
    if (result.success) {
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('dashboardScreen').classList.add('active');
        document.getElementById('userName').textContent = result.user.name;
        
        // Inicializar app
        if (window.app) {
            window.app.loadSection('dashboard');
        } else {
            window.app = new App();
        }
    } else {
        alert(result.message);
    }
});