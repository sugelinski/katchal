// ===== UTILITÁRIOS =====
const Utils = {
    // Formatar data
    formatDate(date, format = 'pt-BR') {
        if (!date) return '';
        const d = new Date(date);
        if (format === 'pt-BR') {
            return d.toLocaleDateString('pt-BR');
        }
        return d.toLocaleString('pt-BR');
    },

    // Formatar moeda
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },

    // Gerar ID único
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },

    // Validar CPF
    validateCPF(cpf) {
        cpf = cpf.replace(/[^\d]/g, '');
        if (cpf.length !== 11) return false;
        
        // Verificar se todos os dígitos são iguais
        if (/^(\d)\1{10}$/.test(cpf)) return false;
        
        // Calcular dígitos verificadores
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let remainder = 11 - (sum % 11);
        let digit = remainder >= 10 ? 0 : remainder;
        if (digit !== parseInt(cpf.charAt(9))) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        remainder = 11 - (sum % 11);
        digit = remainder >= 10 ? 0 : remainder;
        if (digit !== parseInt(cpf.charAt(10))) return false;
        
        return true;
    },

    // Validar Placa (formato antigo e Mercosul)
    validatePlate(plate) {
        plate = plate.toUpperCase().replace(/[^\w]/g, '');
        // Formato antigo: ABC-1234
        if (/^[A-Z]{3}\d{4}$/.test(plate)) return true;
        // Formato Mercosul: ABC1D23
        if (/^[A-Z]{3}\d[A-Z]\d{2}$/.test(plate)) return true;
        return false;
    },

    // Máscara para CPF
    maskCPF(value) {
        value = value.replace(/\D/g, '');
        if (value.length <= 3) return value;
        if (value.length <= 6) return value.replace(/(\d{3})(\d+)/, '$1.$2');
        if (value.length <= 9) return value.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
        return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    },

    // Máscara para Telefone
    maskPhone(value) {
        value = value.replace(/\D/g, '');
        if (value.length <= 2) return `(${value}`;
        if (value.length <= 7) return `(${value.substring(0,2)}) ${value.substring(2)}`;
        return `(${value.substring(0,2)}) ${value.substring(2,7)}-${value.substring(7,11)}`;
    },

    // Calcular idade
    calculateAge(birthDate) {
        if (!birthDate) return null;
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    },

    // Gerar cores aleatórias
    randomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    // Debounce para busca
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Verificar se é número
    isNumeric(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    },

    // Truncar texto
    truncate(text, length = 50) {
        if (!text) return '';
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    },

    // Capitalizar palavras
    capitalize(text) {
        if (!text) return '';
        return text.toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    },

    // Gerar relatório em texto
    generateReportText(records) {
        if (!records || records.length === 0) return 'Nenhum registro encontrado.';
        
        let report = '=== RELATÓRIO DE ESTACIONAMENTO ===\n\n';
        report += `Total de registros: ${records.length}\n`;
        report += `Data: ${new Date().toLocaleString('pt-BR')}\n\n`;
        report += '--- DETALHES ---\n';
        
        records.forEach((r, i) => {
            const vehicle = DB.findById('vehicles', r.vehicle_id);
            const spot = DB.findById('parking_spots', r.spot_id);
            report += `${i+1}. Veículo: ${vehicle ? vehicle.plate : 'N/A'}\n`;
            report += `   Vaga: ${spot ? spot.number : 'N/A'}\n`;
            report += `   Entrada: ${r.entry_time || 'N/A'}\n`;
            report += `   Saída: ${r.exit_time || 'Em andamento'}\n`;
            report += `   Valor: ${r.amount ? `R$ ${r.amount.toFixed(2)}` : 'N/A'}\n\n`;
        });
        
        return report;
    }
};

// ===== MASCARAS AUTOMÁTICAS =====
document.addEventListener('input', function(e) {
    // Máscara para CPF
    if (e.target.id && e.target.id.includes('Cpf')) {
        e.target.value = Utils.maskCPF(e.target.value);
    }
    // Máscara para Telefone
    if (e.target.id && e.target.id.includes('Phone')) {
        e.target.value = Utils.maskPhone(e.target.value);
    }
});

// ===== VALIDAÇÃO DE FORMS =====
document.addEventListener('submit', function(e) {
    // Validar CPF
    const cpfInput = e.target.querySelector('[id$="Cpf"]');
    if (cpfInput && cpfInput.value) {
        if (!Utils.validateCPF(cpfInput.value)) {
            e.preventDefault();
            alert('CPF inválido!');
            return false;
        }
    }
});