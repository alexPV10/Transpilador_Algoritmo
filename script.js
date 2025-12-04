// Estado global mejorado
const estadoApp = {
    historialConsola: [],
    variablesUsuario: new Map(),
    configuracion: {
        tema: 'light',
        tamanoFuente: 'md',
        autoEjecutar: true
    },
    astActual: null,
    contadorVariables: 0
};

// Sistema de Interfaz de Usuario
// ============================================

function inicializarUI() {
    configurarEventListeners();
    actualizarNumerosLinea();
    registrarConsola('🚀 Sistema de transpilación inicializado correctamente', 'success');
    
    // Cargar configuración guardada
    cargarConfiguracion();
    
    // Mostrar ayuda inicial
    //setTimeout(() => mostrarAyuda(), 1000);
}

function configurarEventListeners() {
    const editor = document.getElementById('pseudocodigo');
    
    // Botones principales
    editor.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            procesarPseudocodigo();
        }
    });

    // Sistema de pestañas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            mostrarPestana(tabId);
        });
    });

    // Números de línea en tiempo real
    editor.addEventListener('input', actualizarNumerosLinea);
    editor.addEventListener('scroll', sincronizarScroll);

    // Cerrar modales
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            cerrarTodosModales();
        }
    });

    // Cargar ejemplo por defecto
    setTimeout(() => cargarEjemplo('ordenar'), 300);
}

function actualizarNumerosLinea() {
    const editor = document.getElementById('pseudocodigo');
    const lineNumbers = document.getElementById('lineNumbers');
    const lineas = editor.value.split('\n').length;
    
    let numerosHTML = '';
    const lineasVisibles = Math.max(lineas, 20);
    
    for (let i = 1; i <= lineasVisibles; i++) {
        const clase = i <= lineas ? 'linea-activa' : 'linea-inactiva';
        numerosHTML += `<div class="${clase}">${i}</div>`;
    }
    
    lineNumbers.innerHTML = numerosHTML;
}

function sincronizarScroll() {
    const editor = document.getElementById('pseudocodigo');
    const lineNumbers = document.getElementById('lineNumbers');
    lineNumbers.scrollTop = editor.scrollTop;
}

// Funciones Principales de Transpilación
// ============================================

function procesarPseudocodigo() {
    const pseudocodigo = document.getElementById('pseudocodigo').value.trim();
    const datosEntrada = document.getElementById('datosEntrada').value.trim();
    
    limpiarResultados();
    estadoApp.variablesUsuario.clear();
    estadoApp.contadorVariables = 0;
    
    if (!pseudocodigo) {
        mostrarError('❌ Por favor, escribe algún pseudocódigo para transpilar');
        return;
    }

    try {
        mostrarEstadoCarga('🔍 Analizando pseudocódigo...');
        
        // Procesar datos de entrada si existen
        if (datosEntrada) {
            procesarDatosEntrada(datosEntrada);
        }

        // Transpilar y ejecutar
        const resultado = transpilar(pseudocodigo);
        
        if (estadoApp.configuracion.autoEjecutar) {
            mostrarResultado(resultado);
            mostrarPestana('resultado');
        }
        
    } catch (error) {
        mostrarError(`❌ Error durante la transpilación: ${error.message}`);
        registrarConsola(`Error detallado: ${error.stack}`, 'error');
    }
}

function mostrarEstadoCarga(mensaje) {
    document.getElementById('salidaResultado').innerHTML = 
        `<div class="loading">
            <i class="fas fa-spinner fa-spin"></i> ${mensaje}
         </div>`;
}

function limpiarResultados() {
    document.getElementById('salidaResultado').innerHTML = '';
    document.getElementById('salidaJavascript').innerHTML = '';
    document.getElementById('salidaArbol').innerHTML = '';
}

function mostrarResultado(resultado) {
    const resultadoDiv = document.getElementById('salidaResultado');
    resultadoDiv.innerHTML = '';
    
    if (typeof resultado === 'string') {
        const lineas = resultado.split('\n');
        lineas.forEach(linea => {
            const div = document.createElement('div');
            div.className = 'result-line';
            div.textContent = linea;
            resultadoDiv.appendChild(div);
        });
    } else {
        resultadoDiv.textContent = JSON.stringify(resultado, null, 2);
    }
}

function mostrarError(mensaje) {
    document.getElementById('salidaResultado').innerHTML = 
        `<div class="console-error">
            <i class="fas fa-exclamation-triangle"></i> ${mensaje}
         </div>`;
    mostrarPestana('resultado');
}

function mostrarPestana(nombrePestana) {
    // Ocultar todos los contenidos
    document.querySelectorAll('.tab-content').forEach(div => {
        div.classList.remove('active');
    });
    
    // Mostrar contenido seleccionado
    const tabContent = document.getElementById(`tab-${nombrePestana}`);
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    // Actualizar estado visual de los botones
    document.querySelectorAll('.tab-btn').forEach(boton => {
        boton.classList.remove('active');
    });
    
    // Activar botón seleccionado
    const tabBtn = document.querySelector(`[data-tab="${nombrePestana}"]`);
    if (tabBtn) {
        tabBtn.classList.add('active');
    }
}

// Sistema de Consola y Logging
// ============================================

function registrarConsola(mensaje, tipo = 'info') {
    const timestamp = new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    
    estadoApp.historialConsola.push({timestamp, mensaje, tipo});
    
    const consolaDiv = document.getElementById('salidaConsola');
    if (!consolaDiv) return;
    
    const iconos = {
        'info': 'fa-info-circle',
        'success': 'fa-check-circle',
        'error': 'fa-times-circle',
        'warning': 'fa-exclamation-triangle'
    };
    
    const nuevaLinea = document.createElement('div');
    nuevaLinea.className = `console-line console-${tipo}`;
    nuevaLinea.innerHTML = `
        <i class="fas ${iconos[tipo] || 'fa-info-circle'}"></i>
        <span class="console-time">[${timestamp}]</span>
        <span class="console-message">${mensaje}</span>
    `;
    
    consolaDiv.appendChild(nuevaLinea);
    consolaDiv.scrollTop = consolaDiv.scrollHeight;
}

function limpiarConsola() {
    estadoApp.historialConsola = [];
    const consolaDiv = document.getElementById('salidaConsola');
    if (consolaDiv) {
        consolaDiv.innerHTML = '';
    }
    registrarConsola('🧹 Consola limpiada', 'info');
}

function procesarDatosEntrada(datos) {
    try {
        if (!datos.trim()) return;
        
        let datosParseados;
        
        // Intentar parsear como JSON
        if ((datos.startsWith('{') && datos.endsWith('}')) || 
            (datos.startsWith('[') && datos.endsWith(']'))) {
            datosParseados = JSON.parse(datos);
        } else {
            // Intentar evaluar como expresión JavaScript segura
            datosParseados = eval(`(${datos})`);
        }
        
        if (typeof datosParseados === 'object') {
            if (Array.isArray(datosParseados)) {
                estadoApp.variablesUsuario.set('listaEntrada', datosParseados);
                registrarConsola(`📦 Lista de entrada asignada: ${JSON.stringify(datosParseados)}`, 'success');
            } else {
                Object.entries(datosParseados).forEach(([key, value]) => {
                    estadoApp.variablesUsuario.set(key, value);
                });
                registrarConsola(`📥 Datos de entrada procesados: ${Object.keys(datosParseados).join(', ')}`, 'success');
            }
        } else {
            estadoApp.variablesUsuario.set('entrada', datosParseados);
            registrarConsola(`📝 Valor de entrada asignado: ${datosParseados}`, 'success');
        }
        
    } catch (error) {
        registrarConsola(`⚠️ No se pudieron procesar los datos: ${error.message}`, 'warning');
    }
}

// Sistema de Ejemplos y Utilidades
// ============================================

function cargarEjemplo(tipo) {
    const ejemplos = {
        ordenar: `// Ejemplo: Ordenar una lista
notas = [4.2, 6.8, 5.5, 7.2, 3.8, 8.0]
ORDENAR(notas)
RESULTADO(notas)`,
        
        buscar: `// Ejemplo: Buscar un valor en una lista
ventas = [15000, 22000, 18000, 25000]
valor_buscado = 18000
BUSCAR(valor_buscado, ventas)`,
        
        combinado: `// Ejemplo: Combinado
memoria = [512, 768, 256, 1024, 384, 896]
ORDENAR(memoria)
BUSCAR(1024, memoria)
BUSCAR(256, memoria)`,
        
        aprobados: `// Ejemplo: Búsqueda de aprobados
notas_finales = [4.2, 6.8, 5.5, 7.2, 3.8, 8.0]
ORDENAR(notas_finales)
BUSCAR(6.0, notas_finales)`
    };
    
    if (ejemplos[tipo]) {
        document.getElementById('pseudocodigo').value = ejemplos[tipo];
        document.getElementById('datosEntrada').value = '';
        actualizarNumerosLinea();
        registrarConsola(`📚 Ejemplo "${tipo}" cargado`, 'success');
    }
}

function limpiarEditor() {
    document.getElementById('pseudocodigo').value = '';
    document.getElementById('datosEntrada').value = '';
    actualizarNumerosLinea();
    estadoApp.variablesUsuario.clear();
    registrarConsola('🧹 Editor limpiado', 'info');
}

function formatearCodigo() {
    const editor = document.getElementById('pseudocodigo');
    let codigo = editor.value;
    
    // Eliminar líneas vacías al inicio/final
    codigo = codigo.trim();
    
    // Normalizar saltos de línea
    codigo = codigo.replace(/\r\n/g, '\n');
    
    // Agregar espacios alrededor de operadores
    codigo = codigo.replace(/\s*=\s*/g, ' = ');
    codigo = codigo.replace(/\s*,\s*/g, ', ');
    
    // Espacios después de coma en listas
    codigo = codigo.replace(/\[(\s*)/g, '[');
    codigo = codigo.replace(/(\s*)\]/g, ']');
    
    // Eliminar múltiples espacios
    codigo = codigo.replace(/\s+/g, ' ');
    
    // Mantener saltos de línea originales
    const lineas = codigo.split('\n');
    const lineasFormateadas = lineas.map(linea => {
        if (linea.trim() === '') return '';
        return linea.trim();
    });
    
    editor.value = lineasFormateadas.join('\n');
    actualizarNumerosLinea();
    registrarConsola('✨ Código formateado', 'success');
}

function copiarResultado() {
    const texto = document.getElementById('salidaResultado').textContent;
    copiarAlPortapapeles(texto, 'Resultado');
}

function copiarJavaScript() {
    const texto = document.getElementById('salidaJavascript').textContent;
    copiarAlPortapapeles(texto, 'Código JavaScript');
}

function copiarAlPortapapeles(texto, descripcion) {
    navigator.clipboard.writeText(texto).then(() => {
        mostrarNotificacion(`📋 ${descripcion} copiado al portapapeles`);
        registrarConsola(`${descripcion} copiado`, 'success');
    }).catch(err => {
        registrarConsola(`Error al copiar: ${err.message}`, 'error');
    });
}

// Sistema de Configuración
// ============================================

function cargarConfiguracion() {
    try {
        const configGuardada = localStorage.getItem('transpiladorConfig');
        if (configGuardada) {
            const config = JSON.parse(configGuardada);
            estadoApp.configuracion = { ...estadoApp.configuracion, ...config };
            
            // Aplicar configuración
            aplicarConfiguracion();
        }
    } catch (error) {
        console.warn('Error cargando configuración:', error);
    }
}

function guardarConfiguracion() {
    localStorage.setItem('transpiladorConfig', JSON.stringify(estadoApp.configuracion));
}

function aplicarConfiguracion() {
    // Tema
    if (estadoApp.configuracion.tema === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    // Tamaño de fuente
    const sizes = {
        'sm': '14px',
        'md': '16px', 
        'lg': '18px'
    };
    
    document.documentElement.style.fontSize = 
        sizes[estadoApp.configuracion.tamanoFuente] || '16px';
    
    // Actualizar selects
    const temaSelect = document.getElementById('temaSelect');
    const fuenteSelect = document.getElementById('fuenteSelect');
    
    if (temaSelect) temaSelect.value = estadoApp.configuracion.tema;
    if (fuenteSelect) fuenteSelect.value = estadoApp.configuracion.tamanoFuente;
}

function mostrarConfiguracion() {
    document.getElementById('modalConfig').classList.add('active');
}

function cerrarConfiguracion() {
    document.getElementById('modalConfig').classList.remove('active');
    guardarConfiguracion();
}

function cambiarTema(tema) {
    estadoApp.configuracion.tema = tema;
    aplicarConfiguracion();
    registrarConsola(`🎨 Tema cambiado a: ${tema}`, 'success');
}

function cambiarTamanoFuente(tamano) {
    estadoApp.configuracion.tamanoFuente = tamano;
    aplicarConfiguracion();
    registrarConsola(`🔠 Tamaño de fuente cambiado a: ${tamano}`, 'success');
}

// Sistema de Modal
// ============================================

function mostrarAyuda() {
    document.getElementById('modalAyuda').classList.add('active');
}

function cerrarAyuda() {
    document.getElementById('modalAyuda').classList.remove('active');
}

function cerrarTodosModales() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

function mostrarNotificacion(mensaje, duracion = 3000) {
    // Crear notificación temporal
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion';
    notificacion.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${mensaje}</span>
    `;
    
    document.body.appendChild(notificacion);
    
    // Mostrar con animación
    setTimeout(() => notificacion.classList.add('mostrar'), 10);
    
    // Ocultar y eliminar
    setTimeout(() => {
        notificacion.classList.remove('mostrar');
        setTimeout(() => notificacion.remove(), 300);
    }, duracion);
}

// Núcleo del Transpilador - MEJORADO
// ============================================

class AnalizadorLexico {
    constructor() {
        this.palabrasClave = ['ORDENAR', 'BUSCAR', 'RESULTADO'];
        this.tokenEspecial = {
            '=': 'ASIGNACION',
            '(': 'PARENTESIS_IZQ',
            ')': 'PARENTESIS_DER',
            '[': 'CORCHETE_IZQ',
            ']': 'CORCHETE_DER',
            ',': 'COMA',
            '.': 'PUNTO'
        };
    }

    analizar(entrada) {
        let tokens = [];
        let posicion = 0;
        let numeroLinea = 1;
        let columna = 1;

        while (posicion < entrada.length) {
            let caracter = entrada[posicion];

            // Saltar espacios
            if (this.esEspacio(caracter)) {
                if (caracter === '\n') {
                    numeroLinea++;
                    columna = 1;
                } else if (caracter === '\t') {
                    columna += 4;
                } else {
                    columna++;
                }
                posicion++;
                continue;
            }

            // Saltar comentarios
            if (caracter === '/' && entrada[posicion + 1] === '/') {
                while (posicion < entrada.length && entrada[posicion] !== '\n') {
                    posicion++;
                    columna++;
                }
                continue;
            }

            // Detectar números (enteros y decimales)
            if (this.esDigito(caracter) || (caracter === '.' && this.esDigito(entrada[posicion + 1]))) {
                const tokenNumero = this.analizarNumero(entrada, posicion, numeroLinea, columna);
                tokens.push(tokenNumero.token);
                posicion = tokenNumero.nuevaPosicion;
                columna += tokenNumero.longitud;
                continue;
            }

            // Detectar listas
            if (caracter === '[') {
                const tokenLista = this.analizarLista(entrada, posicion, numeroLinea, columna);
                tokens.push(tokenLista.token);
                posicion = tokenLista.nuevaPosicion;
                columna += tokenLista.longitud;
                continue;
            }

            // Tokens especiales
            if (caracter in this.tokenEspecial) {
                tokens.push({
                    tipo: this.tokenEspecial[caracter],
                    valor: caracter,
                    linea: numeroLinea,
                    columna: columna
                });
                posicion++;
                columna++;
                continue;
            }

            // Identificadores y palabras clave
            if (this.esLetra(caracter) || caracter === '_') {
                const tokenIdentificador = this.analizarIdentificador(entrada, posicion, numeroLinea, columna);
                tokens.push(tokenIdentificador.token);
                posicion = tokenIdentificador.nuevaPosicion;
                columna += tokenIdentificador.longitud;
                continue;
            }

            throw new Error(`Carácter no reconocido: "${caracter}" en línea ${numeroLinea}, columna ${columna}`);
        }

        // Agregar token de fin de archivo
        tokens.push({
            tipo: 'EOF',
            valor: '',
            linea: numeroLinea,
            columna: columna
        });

        return tokens;
    }

    analizarNumero(entrada, posicion, numeroLinea, columna) {
        let numero = '';
        let tienePunto = false;
        let longitud = 0;

        while (posicion < entrada.length) {
            const caracter = entrada[posicion];
            
            if (this.esDigito(caracter)) {
                numero += caracter;
                posicion++;
                longitud++;
            } else if (caracter === '.' && !tienePunto && this.esDigito(entrada[posicion + 1])) {
                numero += caracter;
                posicion++;
                longitud++;
                tienePunto = true;
            } else {
                break;
            }
        }

        const valor = tienePunto ? parseFloat(numero) : parseInt(numero);
        
        return {
            token: {
                tipo: 'NUMERO',
                valor: valor,
                texto: numero,
                linea: numeroLinea,
                columna: columna
            },
            nuevaPosicion: posicion,
            longitud: longitud
        };
    }

    analizarLista(entrada, posicion, numeroLinea, columna) {
        let textoLista = '';
        let longitud = 0;
        let profundidad = 0;
        let inicioPos = posicion;

        while (posicion < entrada.length) {
            const caracter = entrada[posicion];
            textoLista += caracter;
            longitud++;
            posicion++;

            if (caracter === '[') profundidad++;
            if (caracter === ']') {
                profundidad--;
                if (profundidad === 0) break;
            }
        }

        if (profundidad !== 0) {
            throw new Error(`Lista mal cerrada en línea ${numeroLinea}`);
        }

        try {
            // Intentar parsear como array de JavaScript
            const lista = eval(textoLista);
            if (!Array.isArray(lista)) {
                throw new Error('No es una lista válida');
            }

            return {
                token: {
                    tipo: 'LISTA',
                    valor: lista,
                    texto: textoLista,
                    linea: numeroLinea,
                    columna: columna
                },
                nuevaPosicion: posicion,
                longitud: longitud
            };
        } catch (error) {
            throw new Error(`Lista inválida en línea ${numeroLinea}: ${error.message}`);
        }
    }

    analizarIdentificador(entrada, posicion, numeroLinea, columna) {
        let identificador = '';
        let longitud = 0;

        while (posicion < entrada.length) {
            const caracter = entrada[posicion];
            if (!this.esCaracterIdentificador(caracter)) break;
            
            identificador += caracter;
            posicion++;
            longitud++;
        }

        const esPalabraClave = this.palabrasClave.includes(identificador);
        
        return {
            token: {
                tipo: esPalabraClave ? 'PALABRA_CLAVE' : 'IDENTIFICADOR',
                valor: identificador,
                texto: identificador,
                linea: numeroLinea,
                columna: columna
            },
            nuevaPosicion: posicion,
            longitud: longitud
        };
    }

    esEspacio(caracter) { return /\s/.test(caracter); }
    esDigito(caracter) { return /[0-9]/.test(caracter); }
    esLetra(caracter) { return /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(caracter); }
    esCaracterIdentificador(caracter) { return /[a-zA-Z0-9_]/.test(caracter); }
}

class AnalizadorSintactico {
    constructor(tokens) {
        this.tokens = tokens;
        this.posicion = 0;
        this.arbolSintactico = [];
    }

    analizar() {
        this.arbolSintactico = [];
        
        while (this.posicion < this.tokens.length - 1) { // -1 para excluir EOF
            const instruccion = this.analizarInstruccion();
            if (instruccion) {
                this.arbolSintactico.push(instruccion);
            }
        }
        
        return this.arbolSintactico;
    }

    analizarInstruccion() {
        const token = this.tokenActual();
        if (!token || token.tipo === 'EOF') return null;

        // Saltar comentarios
        if (token.tipo === 'COMENTARIO') {
            this.avanzar();
            return this.analizarInstruccion();
        }

        if (token.tipo === 'PALABRA_CLAVE') {
            return this.analizarFuncion();
        } else if (token.tipo === 'IDENTIFICADOR') {
            const siguiente = this.tokenSiguiente();
            if (siguiente && siguiente.tipo === 'ASIGNACION') {
                return this.analizarAsignacion();
            } else {
                // Podría ser una expresión simple
                this.avanzar();
                return null;
            }
        }

        // Si no es ninguna instrucción reconocida, avanzar
        this.avanzar();
        return null;
    }

    analizarFuncion() {
        const tokenFuncion = this.avanzar();
        this.expectar('PARENTESIS_IZQ');

        let argumentos = [];
        
        if (tokenFuncion.valor === 'ORDENAR') {
            const lista = this.analizarExpresion();
            argumentos.push(lista);
        } else if (tokenFuncion.valor === 'BUSCAR') {
            const valor = this.analizarExpresion();
            this.expectar('COMA');
            const lista = this.analizarExpresion();
            argumentos.push(valor, lista);
        } else if (tokenFuncion.valor === 'RESULTADO') {
            const valor = this.analizarExpresion();
            argumentos.push(valor);
        }

        this.expectar('PARENTESIS_DER');

        return {
            tipo: 'LLAMADA_FUNCION',
            funcion: tokenFuncion.valor,
            argumentos: argumentos,
            linea: tokenFuncion.linea,
            columna: tokenFuncion.columna
        };
    }

    analizarAsignacion() {
        const identificador = this.avanzar();
        this.expectar('ASIGNACION');
        const expresion = this.analizarExpresion();

        return {
            tipo: 'ASIGNACION',
            identificador: identificador.valor,
            valor: expresion,
            linea: identificador.linea,
            columna: identificador.columna
        };
    }

    analizarExpresion() {
        const token = this.tokenActual();
        if (!token) throw new Error('Se esperaba una expresión');

        if (token.tipo === 'IDENTIFICADOR') {
            this.avanzar();
            return { 
                tipo: 'VARIABLE', 
                nombre: token.valor,
                linea: token.linea 
            };
        } else if (token.tipo === 'NUMERO') {
            this.avanzar();
            return { 
                tipo: 'NUMERO', 
                valor: token.valor,
                linea: token.linea 
            };
        } else if (token.tipo === 'LISTA') {
            this.avanzar();
            return { 
                tipo: 'LISTA', 
                elementos: token.valor,
                linea: token.linea 
            };
        }

        throw new Error(`Expresión no válida en línea ${token.linea}`);
    }

    tokenActual() { 
        return this.posicion < this.tokens.length ? this.tokens[this.posicion] : null; 
    }
    
    tokenSiguiente() { 
        return this.posicion + 1 < this.tokens.length ? this.tokens[this.posicion + 1] : null; 
    }
    
    avanzar() {
        if (this.posicion >= this.tokens.length) {
            throw new Error('Fin inesperado del código');
        }
        return this.tokens[this.posicion++];
    }
    
    expectar(tipoEsperado) {
        const token = this.avanzar();
        if (!token || token.tipo !== tipoEsperado) {
            const tokenActual = token ? token.valor : 'EOF';
            throw new Error(`Se esperaba ${tipoEsperado} pero se encontró "${tokenActual}" en línea ${token ? token.linea : 'desconocida'}`);
        }
        return token;
    }
}

class GeneradorJavaScript {
    constructor(arbolSintactico) {
        this.arbol = arbolSintactico;
        this.codigoGenerado = '';
        this.variablesDeclaradas = new Set();
        this.contador = 0;
    }

    generar() {
        this.codigoGenerado = '';
        this.variablesDeclaradas.clear();
        
        this.codigoGenerado += "// CÓDIGO GENERADO POR EL TRANSPILADOR\n";
        this.codigoGenerado += "(function() {\n";
        this.codigoGenerado += "  'use strict';\n\n";
        
        this.codigoGenerado += "  // Variables de salida\n";
        this.codigoGenerado += "  let resultado = [];\n";
        this.codigoGenerado += "  let consola = [];\n\n";
        
        this.codigoGenerado += "  // Funciones auxiliares\n";
        this.codigoGenerado += "  function agregarSalida(texto) {\n";
        this.codigoGenerado += "    resultado.push(texto);\n";
        this.codigoGenerado += "    console.log(texto);\n";
        this.codigoGenerado += "  }\n\n";
        
        this.codigoGenerado += "  function logConsola(tipo, mensaje) {\n";
        this.codigoGenerado += "    consola.push({tipo, mensaje, tiempo: new Date().toLocaleTimeString()});\n";
        this.codigoGenerado += "  }\n\n";

        // Generar código para cada instrucción
        this.arbol.forEach((instruccion, index) => {
            this.generarInstruccion(instruccion, index);
        });

        this.codigoGenerado += "\n  // Retornar resultados\n";
        this.codigoGenerado += "  return {\n";
        //this.codigoGenerado += "    salida: resultado.join('\\\\n'),\n";
        this.codigoGenerado += "    salida: resultado,\n";
        this.codigoGenerado += "    consola: consola\n";
        this.codigoGenerado += "  };\n\n";
        
        this.codigoGenerado += "})();";

        return this.codigoGenerado;
    }

    generarVariableUnica(base) {
        this.contador++;
        return `${base}_${this.contador}_${Date.now().toString(36)}`;
    }

    generarInstruccion(instruccion, index) {
        this.codigoGenerado += `\n  // Instrucción ${index + 1}\n`;
        
        switch (instruccion.tipo) {
            case 'ASIGNACION':
                this.generarAsignacion(instruccion);
                break;
            case 'LLAMADA_FUNCION':
                this.generarLlamadaFuncion(instruccion);
                break;
        }
    }

    generarAsignacion(instruccion) {
        const nombreVar = instruccion.identificador;
        const valor = this.generarExpresion(instruccion.valor);
        
        if (!this.variablesDeclaradas.has(nombreVar)) {
            this.codigoGenerado += `  let ${nombreVar} = ${valor};\n`;
            this.variablesDeclaradas.add(nombreVar);
            this.codigoGenerado += `  logConsola('info', 'Variable "${nombreVar}" asignada: ' + JSON.stringify(${nombreVar}));\n`;
        } else {
            this.codigoGenerado += `  ${nombreVar} = ${valor};\n`;
            this.codigoGenerado += `  logConsola('info', 'Variable "${nombreVar}" actualizada: ' + JSON.stringify(${nombreVar}));\n`;
        }
    }

    /*
    generarLlamadaFuncion(instruccion) {
        const funcion = instruccion.funcion;
        
        if (funcion === 'ORDENAR') {
            const lista = this.generarExpresion(instruccion.argumentos[0]);
            const varOrdenada = this.generarVariableUnica('lista_ordenada');
            
            this.codigoGenerado += `  let ${varOrdenada} = ${lista}.slice();\n`;
            this.codigoGenerado += `  ${varOrdenada}.sort((a, b) => a - b);\n`;
            //this.codigoGenerado += `  agregarSalida('📊 Lista ordenada: ' + JSON.stringify(${varOrdenada}));\n`;
            this.codigoGenerado += `  agregarSalida('📊 Lista ordenada: ' + JSON.stringify(${varOrdenada}) + '\\n');\n`;
            this.codigoGenerado += `  logConsola('success', 'Ordenación completada');\n`;
            
            // Si la lista era una variable, actualizarla
            if (instruccion.argumentos[0].tipo === 'VARIABLE') {
                this.codigoGenerado += `  ${instruccion.argumentos[0].nombre} = ${varOrdenada};\n`;
            }
            
        } else if (funcion === 'BUSCAR') {
            const valor = this.generarExpresion(instruccion.argumentos[0]);
            const lista = this.generarExpresion(instruccion.argumentos[1]);
            const varIndice = this.generarVariableUnica('indice');
            
            this.codigoGenerado += `  let ${varIndice} = ${lista}.indexOf(${valor});\n`;
            this.codigoGenerado += `  if (${varIndice} !== -1) {\n`;
            this.codigoGenerado += `    agregarSalida('✅ Valor ${valor} encontrado en posición: ' + ${varIndice} + '\\n');\n`;
            this.codigoGenerado += `    logConsola('success', 'Búsqueda exitosa: valor ${valor} en posición ${varIndice}');\n`;
            this.codigoGenerado += `  } else {\n`;
            this.codigoGenerado += `    agregarSalida('❌ Valor ${valor} no encontrado en la lista' + '\\n');\n`;
            this.codigoGenerado += `    logConsola('warning', 'Valor ${valor} no encontrado');\n`;
            this.codigoGenerado += `  }\n`;
            
        } else if (funcion === 'RESULTADO') {
            const valor = this.generarExpresion(instruccion.argumentos[0]);
            //this.codigoGenerado += `  agregarSalida('📝 Resultado: ' + JSON.stringify(${valor}));\n`;
            this.codigoGenerado += `  agregarSalida('📝 Resultado: ' + JSON.stringify(${valor}) + '\\n');\n`;
            this.codigoGenerado += `  logConsola('info', 'Resultado mostrado');\n`;
        }
    }
    */

    generarLlamadaFuncion(instruccion) {
    const funcion = instruccion.funcion;
    
    if (funcion === 'ORDENAR') {
        const lista = this.generarExpresion(instruccion.argumentos[0]);
        const varOrdenada = this.generarVariableUnica('lista_ordenada');
        
        this.codigoGenerado += `  let ${varOrdenada} = ${lista}.slice();\n`;
        this.codigoGenerado += `  ${varOrdenada}.sort((a, b) => a - b);\n`;
        this.codigoGenerado += `  agregarSalida('📊 Lista ordenada: ' + JSON.stringify(${varOrdenada}));\n`;
        this.codigoGenerado += `  logConsola('success', 'Ordenación completada');\n`;
        
        // Si la lista era una variable, actualizarla
        if (instruccion.argumentos[0].tipo === 'VARIABLE') {
            this.codigoGenerado += `  ${instruccion.argumentos[0].nombre} = ${varOrdenada};\n`;
        }
        
    } else if (funcion === 'BUSCAR') {
        const valor = this.generarExpresion(instruccion.argumentos[0]);
        const lista = this.generarExpresion(instruccion.argumentos[1]);
        const varIndice = this.generarVariableUnica('indice');
        
        this.codigoGenerado += `  let ${varIndice} = ${lista}.indexOf(${valor});\n`;
        this.codigoGenerado += `  if (${varIndice} !== -1) {\n`;
        this.codigoGenerado += `    agregarSalida('✅ Valor ${valor} encontrado en posición: ' + ${varIndice});\n`;
        this.codigoGenerado += `    logConsola('success', 'Búsqueda exitosa: valor ${valor} en posición ${varIndice}');\n`;
        this.codigoGenerado += `  } else {\n`;
        this.codigoGenerado += `    agregarSalida('❌ Valor ${valor} no encontrado en la lista');\n`;
        this.codigoGenerado += `    logConsola('warning', 'Valor ${valor} no encontrado');\n`;
        this.codigoGenerado += `  }\n`;
        
    } else if (funcion === 'RESULTADO') {
        const valor = this.generarExpresion(instruccion.argumentos[0]);
        this.codigoGenerado += `  agregarSalida('📝 Resultado: ' + JSON.stringify(${valor}));\n`;
        this.codigoGenerado += `  logConsola('info', 'Resultado mostrado');\n`;
    }
}

    generarExpresion(expresion) {
        switch (expresion.tipo) {
            case 'NUMERO':
                return expresion.valor.toString();
            case 'LISTA':
                return JSON.stringify(expresion.elementos);
            case 'VARIABLE':
                return expresion.nombre;
            default:
                throw new Error(`Tipo de expresión no soportado: ${expresion.tipo}`);
        }
    }
}

function transpilar(codigoFuente) {
    registrarConsola('🔍 Iniciando proceso de transpilación...', 'info');

    // Fase 1: Análisis Léxico
    const analizadorLexico = new AnalizadorLexico();
    const tokens = analizadorLexico.analizar(codigoFuente);
    registrarConsola(`📊 Análisis léxico completado: ${tokens.length} tokens encontrados`, 'success');

    // Mostrar tokens en consola (opcional)
    if (tokens.length <= 20) {
        tokens.forEach((token, i) => {
            if (token.tipo !== 'EOF') {
                registrarConsola(`Token ${i}: ${token.tipo} = "${token.valor}"`, 'info');
            }
        });
    }

    // Fase 2: Análisis Sintáctico
    const analizadorSintactico = new AnalizadorSintactico(tokens);
    const arbolSintactico = analizadorSintactico.analizar();
    estadoApp.astActual = arbolSintactico;
    registrarConsola(`🌳 Análisis sintáctico completado: ${arbolSintactico.length} instrucciones parseadas`, 'success');

    // Visualizar AST
    visualizarArbolAST(arbolSintactico);

    // Fase 3: Generación de Código
    const generador = new GeneradorJavaScript(arbolSintactico);
    const codigoJS = generador.generar();
    
    // Mostrar código generado
    document.getElementById('salidaJavascript').textContent = codigoJS;
    registrarConsola('⚡ Generación de código JavaScript completada', 'success');

    // Fase 4: Ejecución
    try {
        let codigoEjecucion = '';
        
        // Inyectar variables del usuario
        if (estadoApp.variablesUsuario.size > 0) {
            codigoEjecucion += "// Variables del usuario\n";
            estadoApp.variablesUsuario.forEach((valor, clave) => {
                codigoEjecucion += `let ${clave} = ${JSON.stringify(valor)};\n`;
                registrarConsola(`Inyectada variable: ${clave} = ${JSON.stringify(valor)}`, 'info');
            });
            codigoEjecucion += "\n";
        }
        
        codigoEjecucion += codigoJS;
        
        // Ejecutar
        const resultadoEjecucion = eval(codigoEjecucion);
        registrarConsola('✅ Ejecución completada correctamente', 'success');
        
        // Procesar logs de la consola interna
        if (resultadoEjecucion.consola) {
            resultadoEjecucion.consola.forEach(log => {
                registrarConsola(log.mensaje, log.tipo);
            });
        }
        
        //return resultadoEjecucion.salida || 'Ejecución completada sin salida';
        if (Array.isArray(resultadoEjecucion.salida)) {
                return resultadoEjecucion.salida.join('\n');
            }
        
        return resultadoEjecucion.salida || 'Ejecución completada sin salida';

    } catch (error) {
        const mensajeError = `❌ Error durante la ejecución: ${error.message}`;
        registrarConsola(mensajeError, 'error');
        console.error('Error detallado:', error);
        throw new Error(mensajeError);
    }
}

function visualizarArbolAST(arbol) {
    let astHTML = '<div class="ast-tree">';
    
    if (arbol.length === 0) {
        astHTML += '<div class="ast-empty">No hay instrucciones para mostrar</div>';
    } else {
        arbol.forEach((nodo, index) => {
            astHTML += visualizarNodoAST(nodo, 0, index);
        });
    }
    
    astHTML += '</div>';
    document.getElementById('salidaArbol').innerHTML = astHTML;
}

function visualizarNodoAST(nodo, nivel = 0, index = 0) {
    const indentacion = nivel * 25;
    let html = `<div class="ast-node" style="margin-left: ${indentacion}px">`;
    
    html += `<div class="ast-header">`;
    html += `<span class="ast-type">${nodo.tipo}</span>`;
    
    if (nodo.tipo === 'LLAMADA_FUNCION') {
        html += ` <span class="ast-function">${nodo.funcion}</span>`;
        html += ` <span class="ast-line">(línea ${nodo.linea})</span>`;
    } else if (nodo.tipo === 'ASIGNACION') {
        html += ` <span class="ast-identifier">${nodo.identificador}</span>`;
        html += ` <span class="ast-operator">=</span>`;
    }
    
    html += `</div>`;
    
    if (nodo.argumentos && nodo.argumentos.length > 0) {
        html += `<div class="ast-args">`;
        nodo.argumentos.forEach((arg, i) => {
            html += visualizarNodoAST(arg, nivel + 1, i);
        });
        html += `</div>`;
    }
    
    if (nodo.valor) {
        html += `<div class="ast-value">`;
        html += visualizarNodoAST(nodo.valor, nivel + 1);
        html += `</div>`;
    }
    
    html += `</div>`;
    return html;
}

function exportarArbol() {
    if (!estadoApp.astActual || estadoApp.astActual.length === 0) {
        mostrarNotificacion('❌ No hay árbol AST para exportar');
        return;
    }
    
    const astData = JSON.stringify(estadoApp.astActual, null, 2);
    const blob = new Blob([astData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arbol_ast_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    mostrarNotificacion('🌳 Árbol AST exportado como JSON');
    registrarConsola('Árbol AST exportado', 'success');
}

// Estilos adicionales para notificaciones
const estilosNotificacion = document.createElement('style');
estilosNotificacion.textContent = `
.notificacion {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--primary);
    color: white;
    padding: 12px 20px;
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    display: flex;
    align-items: center;
    gap: 10px;
    transform: translateX(150%);
    transition: transform 0.3s ease;
    z-index: 9999;
    max-width: 350px;
}

.notificacion.mostrar {
    transform: translateX(0);
}

.notificacion i {
    font-size: 1.2rem;
}

.linea-activa {
    color: var(--text-secondary);
}

.linea-inactiva {
    color: var(--border);
}

.result-line {
    margin: 4px 0;
    padding: 2px 0;
    border-bottom: 1px solid var(--border-light);
}
`;

document.head.appendChild(estilosNotificacion);

// Inicialización
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    inicializarUI();
});
