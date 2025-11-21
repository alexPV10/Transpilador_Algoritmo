// Estado global
const estadoApp = {
    historialConsola: [],
    variablesUsuario: {},
    configuracion: {
        tema: 'light',
        tamanoFuente: 'md'
    },
    astActual: null
};


// Sistema de Interfaz de Usuario
// ============================================

function inicializarUI() {
    configurarEventListeners();
    actualizarNumerosLinea();
    registrarConsola('Sistema de transpilación inicializado correctamente', 'success');
    
    // Cargar configuracion guardada
    cargarConfiguracion();
}

function configurarEventListeners() {
    // Botones principales
    document.getElementById('pseudocodigo').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
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

    // Numeros de linea en tiempo real
    document.getElementById('pseudocodigo').addEventListener('input', actualizarNumerosLinea);
    document.getElementById('pseudocodigo').addEventListener('scroll', sincronizarScroll);

    // Cerrar modales al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    // Cerrar modales con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            cerrarAyuda();
            cerrarConfiguracion();
        }
    });

    // Cargar ejemplo por defecto
    setTimeout(() => cargarEjemplo('ordenar'), 500);
}

function actualizarNumerosLinea() {
    const editor = document.getElementById('pseudocodigo');
    const lineNumbers = document.getElementById('lineNumbers');
    const lineas = editor.value.split('\n').length;
    
    let numerosHTML = '';
    for (let i = 1; i <= Math.max(lineas, 15); i++) {
        numerosHTML += `<div>${i}</div>`;
    }
    
    lineNumbers.innerHTML = numerosHTML;
}

function sincronizarScroll() {
    const editor = document.getElementById('pseudocodigo');
    const lineNumbers = document.getElementById('lineNumbers');
    lineNumbers.scrollTop = editor.scrollTop;
}

// Funciones Principales de Transpilacion
// ============================================

function procesarPseudocodigo() {
    const pseudocodigo = document.getElementById('pseudocodigo').value.trim();
    const datosEntrada = document.getElementById('datosEntrada').value.trim();
    
    limpiarResultados();
    
    if (!pseudocodigo) {
        mostrarError('Por favor, escribe algún pseudocódigo para transpilar');
        return;
    }

    try {
        mostrarEstadoCarga('Analizando pseudocódigo...');
        
        if (datosEntrada) {
            procesarDatosEntrada(datosEntrada);
        }

        const resultado = transpilar(pseudocodigo);
        mostrarResultado(resultado);
        mostrarPestana('resultado');
        
    } catch (error) {
        mostrarError('Error durante la transpilación: ' + error.message);
        registrarConsola('Error: ' + error.message, 'error');
    }
}

function mostrarEstadoCarga(mensaje) {
    document.getElementById('salidaResultado').innerHTML = 
        `<div class="loading">${mensaje}</div>`;
}

function limpiarResultados() {
    document.getElementById('salidaResultado').innerHTML = '';
    document.getElementById('salidaJavascript').innerHTML = '';
    document.getElementById('salidaConsola').innerHTML = '';
    document.getElementById('salidaArbol').innerHTML = '';
}

function mostrarResultado(resultado) {
    // Reemplazar \n con saltos de linea reales
    const resultadoFormateado = resultado.replace(/\\n/g, '\n');
    document.getElementById('salidaResultado').textContent = resultadoFormateado;
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
    document.getElementById(`tab-${nombrePestana}`).classList.add('active');
    
    // Actualizar estado visual de los botones
    document.querySelectorAll('.tab-btn').forEach(boton => {
        boton.classList.remove('active');
    });
    
    // Activar boton seleccionado
    document.querySelector(`[data-tab="${nombrePestana}"]`).classList.add('active');
}

// Sistema de Consola y Logging
// ============================================

function registrarConsola(mensaje, tipo = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    
    estadoApp.historialConsola.push({timestamp, mensaje, tipo});
    
    const consolaHtml = estadoApp.historialConsola.map(entry => 
        `<div class="console-line console-${entry.tipo}">[${entry.timestamp}] ${entry.mensaje}</div>`
    ).join('');
    
    document.getElementById('salidaConsola').innerHTML = consolaHtml;
    

    const consolaOutput = document.getElementById('salidaConsola');
    consolaOutput.scrollTop = consolaOutput.scrollHeight;
}

function limpiarConsola() {
    estadoApp.historialConsola = [];
    document.getElementById('salidaConsola').innerHTML = '';
    registrarConsola('Consola limpiada', 'info');
}

function procesarDatosEntrada(datos) {
    try {
        if (datos.startsWith('{') || datos.startsWith('[')) {
            const datosParseados = JSON.parse(datos);
            if (typeof datosParseados === 'object') {
                estadoApp.variablesUsuario = { ...estadoApp.variablesUsuario, ...datosParseados };
                registrarConsola('Datos de entrada procesados correctamente', 'success');
            }
        } else {
            const lista = eval(datos);
            if (Array.isArray(lista)) {
                estadoApp.variablesUsuario.lista = lista;
                registrarConsola(`Lista asignada: ${JSON.stringify(lista)}`, 'success');
            }
        }
    } catch (error) {
        registrarConsola(`No se pudieron procesar los datos: ${error.message}`, 'error');
    }
}

// Sistema de Ejemplos y Utilidades
// ============================================

function cargarEjemplo(tipo) {
    const ejemplos = {
        ordenar: 'ORDENAR([3, 1, 2, 8, 5, 4])',
        buscar: 'BUSCAR(5, [1, 9, 5, 3, 7, 2])',
        combinado: 'mi_lista = [5, 2, 8, 1, 9, 3]\nORDENAR(mi_lista)\nBUSCAR(8, mi_lista)'
    };
    
    document.getElementById('pseudocodigo').value = ejemplos[tipo];
    document.getElementById('datosEntrada').value = '';
    actualizarNumerosLinea();
    
    registrarConsola(`Ejemplo "${tipo}" cargado`, 'success');
}

function limpiarEditor() {
    document.getElementById('pseudocodigo').value = '';
    document.getElementById('datosEntrada').value = '';
    actualizarNumerosLinea();
    registrarConsola('Editor limpiado', 'info');
}

function formatearCodigo() {
    const editor = document.getElementById('pseudocodigo');
    let codigo = editor.value;
    
    // Formateo basico: asegurar espacios alrededor de operadores
    codigo = codigo.replace(/\s*=\s*/g, ' = ');
    codigo = codigo.replace(/\s*,\s*/g, ', ');
    codigo = codigo.replace(/\s*\(\s*/g, '(');
    codigo = codigo.replace(/\s*\)\s*/g, ')');
    
    editor.value = codigo;
    registrarConsola('Código formateado', 'success');
}

function copiarResultado() {
    const texto = document.getElementById('salidaResultado').textContent;
    navigator.clipboard.writeText(texto).then(() => {
        registrarConsola('Resultado copiado al portapapeles', 'success');
    });
}

function copiarJavaScript() {
    const texto = document.getElementById('salidaJavascript').textContent;
    navigator.clipboard.writeText(texto).then(() => {
        registrarConsola('Código JavaScript copiado al portapapeles', 'success');
    });
}

// Sistema de Configuracioon
// ============================================

function cargarConfiguracion() {
    const configGuardada = localStorage.getItem('transpiladorConfig');
    if (configGuardada) {
        const config = JSON.parse(configGuardada);
        estadoApp.configuracion = config;
        
        // Aplicar configuracion
        cambiarTema(config.tema);
        cambiarTamanoFuente(config.tamanoFuente);
        
        // Actualizar selects
        document.getElementById('temaSelect').value = config.tema;
        document.getElementById('fuenteSelect').value = config.tamanoFuente;
    }
}

function guardarConfiguracion() {
    localStorage.setItem('transpiladorConfig', JSON.stringify(estadoApp.configuracion));
}

function mostrarConfiguracion() {
    document.getElementById('modalConfig').classList.add('active');
}

function cerrarConfiguracion() {
    document.getElementById('modalConfig').classList.remove('active');
}

function cambiarTema(tema) {
    estadoApp.configuracion.tema = tema;
    
    if (tema === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    guardarConfiguracion();
    registrarConsola(`Tema cambiado a: ${tema}`, 'success');
}

function cambiarTamanoFuente(tamano) {
    estadoApp.configuracion.tamanoFuente = tamano;
    
    const sizes = {
        'sm': '14px',
        'md': '16px', 
        'lg': '18px'
    };
    
    document.documentElement.style.fontSize = sizes[tamano];
    guardarConfiguracion();
    registrarConsola(`Tamaño de fuente cambiado a: ${tamano}`, 'success');
}

// Sistema de Modal
// ============================================

function mostrarAyuda() {
    document.getElementById('modalAyuda').classList.add('active');
}

function cerrarAyuda() {
    document.getElementById('modalAyuda').classList.remove('active');
}

// Nucleo del Transpilador
// ============================================

class AnalizadorLexico {
    constructor() {
        this.palabrasClave = ['ORDENAR', 'BUSCAR'];
        this.tokenEspecial = {
            '=': 'ASIGNACION',
            '(': 'PARENTESIS_IZQ',
            ')': 'PARENTESIS_DER',
            '[': 'CORCHETE_IZQ',
            ']': 'CORCHETE_DER',
            ',': 'COMA'
        };
    }

    analizar(entrada) {
        let tokens = [];
        let posicion = 0;
        let numeroLinea = 1;

        while (posicion < entrada.length) {
            let caracter = entrada[posicion];

            if (this.esEspacio(caracter)) {
                if (caracter === '\n') numeroLinea++;
                posicion++;
                continue;
            }

            if (caracter === '/' && entrada[posicion + 1] === '/') {
                while (posicion < entrada.length && entrada[posicion] !== '\n') {
                    posicion++;
                }
                continue;
            }

            // Detectar listas
            if (caracter === '[') {
                const tokenLista = this.analizarLista(entrada, posicion, numeroLinea);
                tokens.push(tokenLista.token);
                posicion = tokenLista.nuevaPosicion;
                continue;
            }

            // Tokens especiales
            if (caracter in this.tokenEspecial) {
                tokens.push({
                    tipo: this.tokenEspecial[caracter],
                    valor: caracter,
                    linea: numeroLinea
                });
                posicion++;
                continue;
            }

            // Numeros
            if (this.esDigito(caracter)) {
                const tokenNumero = this.analizarNumero(entrada, posicion, numeroLinea);
                tokens.push(tokenNumero.token);
                posicion = tokenNumero.nuevaPosicion;
                continue;
            }

            // Identificadores y palabras clave
            if (this.esLetra(caracter)) {
                const tokenIdentificador = this.analizarIdentificador(entrada, posicion, numeroLinea);
                tokens.push(tokenIdentificador.token);
                posicion = tokenIdentificador.nuevaPosicion;
                continue;
            }

            throw new Error(`Carácter no reconocido: "${caracter}" en línea ${numeroLinea}`);
        }

        return tokens;
    }

    analizarLista(entrada, posicion, numeroLinea) {
        let inicio = posicion;
        let profundidad = 0;
        
        while (posicion < entrada.length) {
            const caracter = entrada[posicion];
            
            if (caracter === '[') profundidad++;
            if (caracter === ']') profundidad--;
            
            posicion++;
            if (profundidad === 0) break;
        }
        
        const textoLista = entrada.substring(inicio, posicion);
        try {
            const lista = JSON.parse(textoLista);
            return {
                token: {
                    tipo: 'LISTA',
                    valor: lista,
                    linea: numeroLinea,
                    textoOriginal: textoLista
                },
                nuevaPosicion: posicion
            };
        } catch (error) {
            try {
                const lista = eval(textoLista);
                if (Array.isArray(lista)) {
                    return {
                        token: {
                            tipo: 'LISTA',
                            valor: lista,
                            linea: numeroLinea,
                            textoOriginal: textoLista
                        },
                        nuevaPosicion: posicion
                    };
                }
                throw new Error('No es una lista válida');
            } catch (e) {
                throw new Error(`Lista mal formada en línea ${numeroLinea}: ${textoLista}`);
            }
        }
    }

    analizarNumero(entrada, posicion, numeroLinea) {
        let numero = '';
        while (posicion < entrada.length && this.esDigito(entrada[posicion])) {
            numero += entrada[posicion];
            posicion++;
        }
        return {
            token: {
                tipo: 'NUMERO',
                valor: parseInt(numero),
                linea: numeroLinea
            },
            nuevaPosicion: posicion
        };
    }

    analizarIdentificador(entrada, posicion, numeroLinea) {
        let identificador = '';
        while (posicion < entrada.length && this.esCaracterIdentificador(entrada[posicion])) {
            identificador += entrada[posicion];
            posicion++;
        }

        const token = this.palabrasClave.includes(identificador) ? {
            tipo: 'PALABRA_CLAVE',
            valor: identificador,
            linea: numeroLinea
        } : {
            tipo: 'IDENTIFICADOR',
            valor: identificador,
            linea: numeroLinea
        };

        return { token, nuevaPosicion: posicion };
    }

    esEspacio(caracter) { return /\s/.test(caracter); }
    esDigito(caracter) { return /[0-9]/.test(caracter); }
    esLetra(caracter) { return /[a-zA-Z_]/.test(caracter); }
    esCaracterIdentificador(caracter) { return /[a-zA-Z0-9_]/.test(caracter); }
}

class AnalizadorSintactico {
    constructor(tokens) {
        this.tokens = tokens;
        this.posicion = 0;
        this.arbolSintactico = [];
    }

    analizar() {
        while (this.posicion < this.tokens.length) {
            const instruccion = this.analizarInstruccion();
            if (instruccion) {
                this.arbolSintactico.push(instruccion);
            }
        }
        return this.arbolSintactico;
    }

    analizarInstruccion() {
        const token = this.tokenActual();
        if (!token) return null;

        if (token.tipo === 'PALABRA_CLAVE') {
            return this.analizarFuncion();
        } else if (token.tipo === 'IDENTIFICADOR') {
            const siguiente = this.tokenSiguiente();
            if (siguiente && siguiente.tipo === 'ASIGNACION') {
                return this.analizarAsignacion();
            }
        }

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
        }

        this.expectar('PARENTESIS_DER');

        return {
            tipo: 'LLAMADA_FUNCION',
            funcion: tokenFuncion.valor,
            argumentos: argumentos,
            linea: tokenFuncion.linea
        };
    }

    analizarAsignacion() {
        const identificador = this.avanzar();
        this.avanzar(); // Consumir '='
        const expresion = this.analizarExpresion();

        return {
            tipo: 'ASIGNACION',
            identificador: identificador.valor,
            valor: expresion,
            linea: identificador.linea
        };
    }

    analizarExpresion() {
        const token = this.tokenActual();
        if (!token) throw new Error('Se esperaba una expresión');

        if (token.tipo === 'IDENTIFICADOR') {
            this.avanzar();
            return { tipo: 'VARIABLE', nombre: token.valor };
        } else if (token.tipo === 'NUMERO') {
            this.avanzar();
            return { tipo: 'NUMERO', valor: token.valor };
        } else if (token.tipo === 'LISTA') {
            const listaValor = token.valor;
            this.avanzar();
            return { tipo: 'LISTA', elementos: listaValor };
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
            throw new Error(`Se esperaba ${tipoEsperado} en línea ${token ? token.linea : 'desconocida'}`);
        }
        return token;
    }
}

class GeneradorJavaScript {
    constructor(arbolSintactico) {
        this.arbol = arbolSintactico;
        this.codigoGenerado = '';
        this.variables = new Map();
    }

    generar() {
        this.codigoGenerado = '';
        
        this.codigoGenerado += "// Código generado automáticamente\n";
        this.codigoGenerado += "function ejecutarTranspilacion() {\n";
        this.codigoGenerado += "  let resultado = '';\n\n";

        for (const instruccion of this.arbol) {
            if (instruccion) {
                this.generarInstruccion(instruccion);
            }
        }

        this.codigoGenerado += "  return resultado;\n";
        this.codigoGenerado += "}\n\n";
        this.codigoGenerado += "ejecutarTranspilacion();";

        return this.codigoGenerado;
    }

    generarInstruccion(instruccion) {
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
        
        this.codigoGenerado += `  let ${nombreVar} = ${valor};\n`;
        this.variables.set(nombreVar, true);
    }

    generarLlamadaFuncion(instruccion) {
        const funcion = instruccion.funcion;
        
        if (funcion === 'ORDENAR') {
            const lista = this.generarExpresion(instruccion.argumentos[0]);
            this.codigoGenerado += `  let lista_ordenada = ${lista}.slice().sort((a, b) => a - b);\n`;
            this.codigoGenerado += `  resultado += 'Lista ordenada: ' + JSON.stringify(lista_ordenada) + '\\\\n';\n`;
        } else if (funcion === 'BUSCAR') {
            const valor = this.generarExpresion(instruccion.argumentos[0]);
            const lista = this.generarExpresion(instruccion.argumentos[1]);
            this.codigoGenerado += `  let indice = ${lista}.indexOf(${valor});\n`;
            this.codigoGenerado += `  if (indice !== -1) {\n`;
            this.codigoGenerado += `    resultado += 'Valor ${valor} encontrado en posición: ' + indice + '\\\\n';\n`;
            this.codigoGenerado += `  } else {\n`;
            this.codigoGenerado += `    resultado += 'Valor ${valor} no encontrado en la lista\\\\n';\n`;
            this.codigoGenerado += `  }\n`;
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
    registrarConsola('Iniciando proceso de transpilación...', 'info');

    // Fase 1: Análisis Léxico
    const analizadorLexico = new AnalizadorLexico();
    const tokens = analizadorLexico.analizar(codigoFuente);
    registrarConsola(`Análisis léxico completado: ${tokens.length} tokens encontrados`, 'success');

    // Fase 2: Análisis Sintáctico
    const analizadorSintactico = new AnalizadorSintactico(tokens);
    const arbolSintactico = analizadorSintactico.analizar();
    estadoApp.astActual = arbolSintactico;
    registrarConsola(`Análisis sintáctico completado: ${arbolSintactico.length} instrucciones parseadas`, 'success');

    // Visualizar AST
    visualizarArbolAST(arbolSintactico);

    // Fase 3: Generacin de Coodigo
    const generador = new GeneradorJavaScript(arbolSintactico);
    const codigoJS = generador.generar();
    
    document.getElementById('salidaJavascript').textContent = codigoJS;
    registrarConsola('Generación de código JavaScript completada', 'success');

    // Fase 4: Ejecucin
    try {
        let codigoEjecucion = '';
        for (const [key, value] of Object.entries(estadoApp.variablesUsuario)) {
            codigoEjecucion += `let ${key} = ${JSON.stringify(value)};\n`;
        }
        codigoEjecucion += codigoJS;

        const resultadoEjecucion = eval(codigoEjecucion);
        registrarConsola('Ejecución completada correctamente', 'success');

        return resultadoEjecucion;

    } catch (error) {
        registrarConsola(`Error durante la ejecución: ${error.message}`, 'error');
        throw error;
    }
}

function visualizarArbolAST(arbol) {
    let astHTML = '<div class="ast-tree">';
    
    arbol.forEach((nodo, index) => {
        astHTML += visualizarNodoAST(nodo, index);
    });
    
    astHTML += '</div>';
    document.getElementById('salidaArbol').innerHTML = astHTML;
}

function visualizarNodoAST(nodo, nivel = 0) {
    let html = `<div class="ast-node" style="margin-left: ${nivel * 20}px">`;
    
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
    
    if (nodo.argumentos) {
        nodo.argumentos.forEach(arg => {
            html += visualizarNodoAST(arg, nivel + 1);
        });
    }
    
    if (nodo.valor) {
        html += visualizarNodoAST(nodo.valor, nivel + 1);
    }
    
    html += `</div>`;
    return html;
}

function exportarArbol() {
    const astData = JSON.stringify(estadoApp.astActual, null, 2);
    const blob = new Blob([astData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arbol_ast.json';
    a.click();
    URL.revokeObjectURL(url);
    registrarConsola('Árbol AST exportado como JSON', 'success');
}

// Inicializacion
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    inicializarUI();
});