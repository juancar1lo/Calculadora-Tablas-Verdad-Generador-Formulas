// Traducciones para español y euskera
const translations = {
    es: {
        title: "Calculadora de Tablas de Verdad",
        legendTitle: "Leyenda de Símbolos",
        conjunction: "Conjunción",
        disjunction: "Disyunción",
        negation: "Negación",
        conditional: "Condicional",
        biconditional: "Bicondicional",
        parentheses: "Paréntesis",
        variables: "Variables",
        expressionLabel: "Expresión Lógica:",
        calculate: "Calcular",
        clear: "Limpiar",
        exportPDF: "Exportar PDF",
        resetView: "Resetear Vista",
        randomGeneratorTitle: "Generador de Fórmulas Aleatorias",
        numVariables: "Número de variables (1-5):",
        depth: "Profundidad (1-5):",
        operandsPerSubformula: "Operandos por subfórmula (1-4):",
        allowedOperators: "Operadores permitidos",
        generateFormula: "Generar Fórmula Aleatoria",
        tautology: "Tautología",
        contradiction: "Contradicción",
        indeterminacy: "Indeterminación",
        result: "Resultado:",
        final: "Final", // Para la tabla de verdad
        pdfTitle: "La tabla de verdad es: " // Para el PDF
    },
    eu: {
        title: "Egia-taulen kalkulagailua",
        legendTitle: "Sinboloen Legenda",
        conjunction: "Juntagailua",
        disjunction: "Disjuntzioa",
        negation: "Ukazioa",
        conditional: "Baldintzazkoa",
        biconditional: "Baldintzazbikoa",
        parentheses: "Parentesiak",
        variables: "Aldagaiak",
        expressionLabel: "Adierazpen logikoa:",
        calculate: "Kalkulatu",
        clear: "Garbitu",
        exportPDF: "PDF-ra esportatu",
        resetView: "Berrasieratu",
        randomGeneratorTitle: "Ausazko formulen sorgailua",
        numVariables: "Aldagai kopurua (1-5):",
        depth: "Sakonera (1-5):",
        operandsPerSubformula: "Azpiformula bidezko eragigaiak (1-4):",
        allowedOperators: "Baimendutako eragileak",
        generateFormula: "Sortu ausazko formula",
        tautology: "Tautologia",
        contradiction: "Kontraesana",
        indeterminacy: "Indeterminazioa",
        result: "Emaitza:",
        final: "Emaitza", // Para la tabla de verdad
        pdfTitle: "Egia-taula da: " // Para el PDF
    }
};

// Variable global para el idioma actual
let currentLang = 'es';

// Variables globales para el zoom y el árbol actual
let currentSvg = null;
let currentZoomBehavior = null;
let currentD3TreeData = null;

// Función para actualizar el idioma en la interfaz
function updateLanguage(lang) {
    currentLang = lang;
    document.getElementById('title').textContent = translations[lang].title;
    document.getElementById('legendTitle').innerHTML = `<strong>${translations[lang].legendTitle}</strong>`;
    document.getElementById('conjunction').textContent = translations[lang].conjunction;
    document.getElementById('disjunction').textContent = translations[lang].disjunction;
    document.getElementById('negation').textContent = translations[lang].negation;
    document.getElementById('conditional').textContent = translations[lang].conditional;
    document.getElementById('biconditional').textContent = translations[lang].biconditional;
    document.getElementById('parentheses').textContent = translations[lang].parentheses;
    document.getElementById('variables').textContent = translations[lang].variables;
    document.getElementById('expressionLabel').innerHTML = `<strong>${translations[lang].expressionLabel}</strong>`;
    document.getElementById('btnCalcular').textContent = translations[lang].calculate;
    document.getElementById('btnLimpiar').textContent = translations[lang].clear;
    document.getElementById('btnExportar').textContent = translations[lang].exportPDF;
    document.getElementById('btnResetZoom').textContent = translations[lang].resetView;
    document.getElementById('randomGeneratorTitle').textContent = translations[lang].randomGeneratorTitle;
    document.getElementById('numVariablesLabel').textContent = translations[lang].numVariables;
    document.getElementById('depthLabel').textContent = translations[lang].depth;
    document.getElementById('operandsPerSubformulaLabel').textContent = translations[lang].operandsPerSubformula;
    document.getElementById('allowedOperators').textContent = translations[lang].allowedOperators;
    document.getElementById('btnGenerarFormula').textContent = translations[lang].generateFormula;
}

// ### Evaluación y Generación del Árbol Sintáctico

// Crear una asignación por defecto: asigna "true" a cada variable
function defaultAssignment(ast) {
    let assignment = {};

    function traverse(node) {
        if (node.type === "VAR") {
            assignment[node.name] = true;
        } else {
            if (node.operand) traverse(node.operand);
            if (node.left) traverse(node.left);
            if (node.right) traverse(node.right);
        }
    }
    traverse(ast);
    return assignment;
}

// Recorrer el AST y adjuntar valores evaluados en cada nodo
function attachValues(node, assignment) {
    if (node.type === "VAR") {
        node.valor = assignment[node.name];
        return node;
    }
    if (node.type === "NOT") {
        node.operand = attachValues(node.operand, assignment);
        node.valor = !node.operand.valor;
        return node;
    }
    if (node.type === "AND") {
        node.left = attachValues(node.left, assignment);
        node.right = attachValues(node.right, assignment);
        node.valor = node.left.valor && node.right.valor;
        return node;
    }
    if (node.type === "OR") {
        node.left = attachValues(node.left, assignment);
        node.right = attachValues(node.right, assignment);
        node.valor = node.left.valor || node.right.valor;
        return node;
    }
    if (node.type === "IMP") {
        node.left = attachValues(node.left, assignment);
        node.right = attachValues(node.right, assignment);
        node.valor = (!node.left.valor) || node.right.valor;
        return node;
    }
    if (node.type === "BICOND") {
        node.left = attachValues(node.left, assignment);
        node.right = attachValues(node.right, assignment);
        node.valor = node.left.valor === node.right.valor;
        return node;
    }
    return node;
}

function attachValuesToAST(ast) {
    const assignment = defaultAssignment(ast);
    return attachValues(ast, assignment);
}

// ### Funciones para la Tabla de Verdad

function splitExpression(expr) {
    expr = expr.replace(/\s+/g, '');
    const tokens = [];
    let i = 0;
    while (i < expr.length) {
        const ch = expr[i];
        if (/[pqrst]/.test(ch)) {
            tokens.push(ch);
            i++;
            continue;
        }
        if (ch === '¬' || ch === '∧' || ch === '∨' || ch === '(' || ch === ')') {
            tokens.push(ch);
            i++;
            continue;
        }
        if (ch === '→' || ch === '↔') {
            tokens.push(ch);
            i++;
            continue;
        }
        i++;
    }
    return tokens;
}

function precedence(op) {
    switch (op) {
        case '¬':
            return 5;
        case '∧':
            return 4;
        case '∨':
            return 3;
        case '→':
            return 2;
        case '↔':
            return 1;
        default:
            return 0;
    }
}

function isLeftAssociative(op) { return (op === '∧' || op === '∨' || op === '↔'); }

function isUnary(op) { return (op === '¬'); }

function isBinary(op) { return (op === '∧' || op === '∨' || op === '→' || op === '↔'); }

function applyOperator(op, left, right) {
    switch (op) {
        case '¬':
            return !left;
        case '∧':
            return left && right;
        case '∨':
            return left || right;
        case '→':
            return (!left) || right;
        case '↔':
            return left === right;
        default:
            return false;
    }
}

function evaluateRowInfix(tokens, values) {
    const opStack = [],
        valStack = [],
        resultByIndex = [];

    function popAndApply() {
        const opObj = opStack.pop();
        const op = opObj.op;
        if (isUnary(op)) {
            const val = valStack.pop();
            const res = applyOperator(op, val, null);
            valStack.push(res);
            resultByIndex[opObj.tokenIndex] = res ? 1 : 0;
        } else {
            const right = valStack.pop(),
                left = valStack.pop();
            const res = applyOperator(op, left, right);
            valStack.push(res);
            resultByIndex[opObj.tokenIndex] = res ? 1 : 0;
        }
    }
    for (let i = 0; i < tokens.length; i++) {
        let tk = tokens[i];
        if (/[pqrst]/.test(tk)) {
            let boolVal = !!values[tk];
            valStack.push(boolVal);
            resultByIndex[i] = boolVal ? 1 : 0;
        } else if (tk === '(') {
            opStack.push({ op: tk, tokenIndex: i });
            resultByIndex[i] = '';
        } else if (tk === ')') {
            while (opStack.length > 0 && opStack[opStack.length - 1].op !== '(') { popAndApply(); }
            if (opStack.length > 0 && opStack[opStack.length - 1].op === '(') { opStack.pop(); }
            resultByIndex[i] = '';
        } else if (isUnary(tk)) {
            opStack.push({ op: tk, tokenIndex: i });
            resultByIndex[i] = '';
        } else if (isBinary(tk)) {
            const currentOpPrec = precedence(tk);
            while (opStack.length > 0 && opStack[opStack.length - 1].op !== '(') {
                const topOp = opStack[opStack.length - 1],
                    topPrec = precedence(topOp.op);
                if ((topPrec > currentOpPrec) || (topPrec === currentOpPrec && isLeftAssociative(topOp.op))) { popAndApply(); } else { break; }
            }
            opStack.push({ op: tk, tokenIndex: i });
            resultByIndex[i] = '';
        } else { resultByIndex[i] = ''; }
    }
    while (opStack.length > 0) {
        const top = opStack.pop();
        if (top.op === '(' || top.op === ')') continue;
        opStack.push({ op: top.op, tokenIndex: top.tokenIndex });
        popAndApply();
    }
    let finalResult = valStack.length > 0 ? (valStack[0] ? 1 : 0) : '';
    resultByIndex.push(finalResult);
    return { partials: resultByIndex, final: finalResult };
}

function generateTruthTable(expression) {
    const tokens = splitExpression(expression);
    if (tokens.length === 0) return null;
    const tokensWithFinal = tokens.slice();
    tokensWithFinal.push(translations[currentLang].final); // "Final" o "Emaitza"
    let varsSet = new Set();
    tokens.forEach(t => { if (/[pqrst]/.test(t)) { varsSet.add(t); } });
    let vars = Array.from(varsSet);
    vars.sort();
    let numRows = Math.pow(2, vars.length),
        rows = [],
        finalResults = [];
    for (let i = 0; i < numRows; i++) {
        let assignment = {};
        for (let j = 0; j < vars.length; j++) {
            let bit = (i >> (vars.length - 1 - j)) & 1;
            assignment[vars[j]] = (bit === 1);
        }
        let evaluation = evaluateRowInfix(tokens, assignment);
        let partials = evaluation.partials,
            final = evaluation.final;
        finalResults.push(final);
        rows.push({ assignment, partials });
    }
    let uniqueVals = new Set(finalResults),
        verdict = '';
    if (uniqueVals.size === 1) { verdict = uniqueVals.has(1) ? 'Tautología' : 'Contradicción'; } else { verdict = 'Indeterminación'; }
    return { tokens: tokensWithFinal, vars, rows, verdict };
}

function renderTruthTable(tableData) {
    if (!tableData) return '<p style="color:red">Expresión inválida o vacía.</p>';
    const { tokens, rows, verdict } = tableData;
    let html = '<table style="margin:auto; border-collapse:collapse;">';
    html += '<thead><tr>';
    tokens.forEach(tk => { html += `<th style="border:1px solid black; padding:4px;">${tk}</th>`; });
    html += '</tr></thead><tbody>';
    rows.forEach(row => {
        const partials = row.partials;
        html += '<tr>';
        for (let i = 0; i < tokens.length; i++) {
            let cellVal = partials[i] !== undefined ? partials[i] : '';
            html += `<td style="border:1px solid black; padding:4px;">${cellVal}</td>`;
        }
        html += '</tr>';
    });
    html += '</tbody></table>';
    let verdictText = verdict === 'Tautología' ? translations[currentLang].tautology :
        verdict === 'Contradicción' ? translations[currentLang].contradiction :
        translations[currentLang].indeterminacy;
    html += `<p><strong>${translations[currentLang].result} ${verdictText}</strong></p>`;
    return html;
}

// Exportar a PDF
document.getElementById('btnExportar').addEventListener('click', function() {
    const tableContainer = document.getElementById('resultadoTabla');
    if (tableContainer.innerHTML.trim() === "") {
        alert("Primero genera la tabla de verdad para exportarla.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(translations[currentLang].pdfTitle, 10, 20); // "La tabla de verdad es" o "Egia-taula da"
    html2canvas(tableContainer, { scale: 2 }).then(function(canvas) {
        const imgData = canvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth() - 20;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        doc.addImage(imgData, 'PNG', 10, 30, pdfWidth, pdfHeight);
        doc.save("tabla_verdad.pdf");
    }).catch(function(error) {
        console.error("Error al generar el PDF:", error);
        alert("Ocurrió un error al generar el PDF. Revisa la consola para más detalles.");
    });
});

// ### Parser y Visualización Interactiva del Árbol Sintáctico

function tokenizeParser(expr) {
    expr = expr.replace(/\s+/g, '');
    const tokens = [];
    for (let i = 0; i < expr.length; i++) {
        const ch = expr[i];
        if ("pqrst".includes(ch)) { tokens.push({ type: "VAR", value: ch }); } else if ("∧∨¬→↔()".includes(ch)) { tokens.push({ type: "OP", value: ch }); }
    }
    return tokens;
}

function parseExpressionParser(expr) {
    const tokens = tokenizeParser(expr);
    let index = 0;

    function peek() { return tokens[index]; }

    function consume() { return tokens[index++]; }

    function parsePrimary() {
        const token = peek();
        if (!token) throw new Error("Expresión incompleta");
        if (token.type === "VAR") { consume(); return { type: "VAR", name: token.value }; }
        if (token.value === "(") {
            consume();
            const node = parseBiconditional();
            if (!peek() || peek().value !== ")") throw new Error("Se esperaba ')'");
            consume();
            return node;
        }
        throw new Error("Token inesperado: " + token.value);
    }

    function parseNot() {
        const token = peek();
        if (token && token.value === "¬") {
            consume();
            const operand = parseNot();
            return { type: "NOT", operand: operand };
        }
        return parsePrimary();
    }

    function parseAnd() {
        let node = parseNot();
        while (peek() && peek().value === "∧") {
            consume();
            const right = parseNot();
            node = { type: "AND", left: node, right: right };
        }
        return node;
    }

    function parseOr() {
        let node = parseAnd();
        while (peek() && peek().value === "∨") {
            consume();
            const right = parseAnd();
            node = { type: "OR", left: node, right: right };
        }
        return node;
    }

    function parseImp() {
        let node = parseOr();
        if (peek() && peek().value === "→") {
            consume();
            const right = parseImp();
            node = { type: "IMP", left: node, right: right };
        }
        return node;
    }

    function parseBiconditional() {
        let node = parseImp();
        while (peek() && peek().value === "↔") {
            consume();
            const right = parseImp();
            node = { type: "BICOND", left: node, right: right };
        }
        return node;
    }
    const tree = parseBiconditional();
    if (index < tokens.length) throw new Error("Tokens sobrantes en la expresión");
    return tree;
}

// Convertir al formato D3 sin concatenar valores evaluados
function convertToD3Format(node) {
    if (!node) return null;
    let d3Node = {};
    if (node.type === "VAR") {
        d3Node.name = node.name;
    } else if (node.type === "NOT") {
        d3Node.name = "¬";
        d3Node.children = [convertToD3Format(node.operand)];
    } else if (node.type === "AND") {
        d3Node.name = "∧";
        d3Node.children = [convertToD3Format(node.left), convertToD3Format(node.right)];
    } else if (node.type === "OR") {
        d3Node.name = "∨";
        d3Node.children = [convertToD3Format(node.left), convertToD3Format(node.right)];
    } else if (node.type === "IMP") {
        d3Node.name = "→";
        d3Node.children = [convertToD3Format(node.left), convertToD3Format(node.right)];
    } else if (node.type === "BICOND") {
        d3Node.name = "↔";
        d3Node.children = [convertToD3Format(node.left), convertToD3Format(node.right)];
    } else {
        d3Node.name = node.type;
    }
    return d3Node;
}

// Visualizar el árbol en orientación vertical con animación
function visualizeParseTree(treeData) {
    const margin = { top: 20, right: 90, bottom: 30, left: 90 },
        width = 660 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    d3.select("#parseTree").select("svg").remove();
    const svg = d3.select("#parseTree").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
    currentSvg = svg;
    const g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    const zoom = d3.zoom()
        .scaleExtent([0.5, 3])
        .on("zoom", (event) => { g.attr("transform", event.transform); });
    svg.call(zoom);
    currentZoomBehavior = zoom;
    const treemap = d3.tree().size([width, height]);
    const nodes = d3.hierarchy(treeData, d => d.children);
    const treeRoot = treemap(nodes);

    const link = g.selectAll(".link")
        .data(treeRoot.descendants().slice(1))
        .enter().append("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 2)
        .attr("d", d => "M" + d.x + "," + d.y + "L" + d.x + "," + d.y)
        .transition()
        .duration(750)
        .delay(d => d.depth * 300)
        .attr("d", d => {
            return "M" + d.x + "," + d.y +
                "C" + d.x + "," + (d.y + d.parent.y) / 2 +
                " " + d.parent.x + "," + (d.y + d.parent.y) / 2 +
                " " + d.parent.x + "," + d.parent.y;
        });

    const node = g.selectAll(".node")
        .data(treeRoot.descendants())
        .enter().append("g")
        .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
        .attr("transform", d => "translate(" + d.x + "," + d.y + ")");

    node.append("circle")
        .attr("r", 0)
        .attr("fill", d => {
            if (d.data.valor === true) return "lightgreen";
            else if (d.data.valor === false) return "lightcoral";
            else return "#fff";
        })
        .attr("stroke", "steelblue")
        .attr("stroke-width", 3)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke", "red").attr("stroke-width", 5);
            d3.select("#tooltip")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px")
                .style("display", "inline-block")
                .html("<strong>Nodo:</strong> " + d.data.name);
        })
        .on("mouseout", function(event, d) {
            d3.select(this).attr("stroke", "steelblue").attr("stroke-width", 3);
            d3.select("#tooltip").style("display", "none");
        })
        .on("click", function(event, d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else if (d._children) {
                d.children = d._children;
                d._children = null;
            }
            visualizeParseTree(currentD3TreeData);
        })
        .transition()
        .duration(750)
        .delay(d => d.depth * 300)
        .attr("r", 10);

    node.append("text")
        .attr("dy", ".35em")
        .attr("x", d => d.children ? -13 : 13)
        .style("font-weight", "bold")
        .style("text-anchor", d => d.children ? "end" : "start")
        .text(d => d.data.name)
        .style("opacity", 0)
        .transition()
        .duration(750)
        .delay(d => d.depth * 300)
        .style("opacity", 1);
}

// Botón para Resetear Zoom
document.getElementById('btnResetZoom').addEventListener('click', function() {
    if (currentSvg && currentZoomBehavior) {
        currentSvg.transition().duration(750).call(currentZoomBehavior.transform, d3.zoomIdentity);
    }
});

// Al enviar el formulario: genera tabla y árbol
document.getElementById('tablaVerdadForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const expression = document.getElementById('expresion').value;
    const tableData = generateTruthTable(expression);
    const tableHTML = renderTruthTable(tableData);
    document.getElementById('resultadoTabla').innerHTML = tableHTML;
    try {
        let ast = parseExpressionParser(expression);
        ast = attachValuesToAST(ast);
        const d3TreeData = convertToD3Format(ast);
        currentD3TreeData = d3TreeData;
        visualizeParseTree(d3TreeData);
    } catch (error) {
        console.error("Error al generar el árbol sintáctico:", error);
    }
});

// ### Generador Aleatorio de Fórmulas Proposicionales

function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function chance(p) {
    return Math.random() < p;
}

/*
  Genera una fórmula aleatoria respetando los operadores seleccionados.
  - numVars: número de variables (1 a 5).
  - depth: profundidad de la fórmula (1 a 5).
  - varsPerSub: máximo de operandos por subfórmula (1 a 4).
  - allowedOps: operadores permitidos por el usuario.
*/
function generateRandomFormula(numVars, depth, varsPerSub, allowedOps) {
    const variables = ["p", "q", "r", "s", "t"].slice(0, numVars);
    const binaryOps = ["∧", "∨", "→", "↔"].filter(op => allowedOps.includes(op));
    const allowNegation = allowedOps.includes("¬");

    if (depth <= 0) {
        let varFormula = randomElement(variables);
        if (allowNegation && chance(0.3)) {
            return "¬" + varFormula;
        }
        return varFormula;
    }

    if (binaryOps.length === 0) {
        throw new Error("Debe permitir al menos un operador binario para generar fórmulas con profundidad mayor que 0.");
    }

    const numOperands = Math.floor(Math.random() * (varsPerSub - 1)) + 2;
    let formula = generateRandomFormula(numVars, depth - 1, varsPerSub, allowedOps);

    for (let i = 1; i < numOperands; i++) {
        const op = randomElement(binaryOps);
        const rightExpr = generateRandomFormula(numVars, depth - 1, varsPerSub, allowedOps);
        formula = "(" + formula + op + rightExpr + ")";
    }

    if (allowNegation && chance(0.2)) {
        formula = "¬" + formula;
    }

    return formula;
}

// Evento para Generar Fórmula Aleatoria
document.getElementById('btnGenerarFormula').addEventListener('click', function() {
    const numVars = parseInt(document.getElementById('numVariables').value, 10);
    const depth = parseInt(document.getElementById('profundidad').value, 10);
    const varsPerSub = parseInt(document.getElementById('varsSubformula').value, 10);

    const allowedOps = [];
    document.querySelectorAll('.operator:checked').forEach(function(checkbox) {
        allowedOps.push(checkbox.value);
    });

    const binaryOps = ["∧", "∨", "→", "↔"];
    const hasBinaryOp = binaryOps.some(op => allowedOps.includes(op));
    if (depth > 0 && !hasBinaryOp) {
        alert("Debe seleccionar al menos un operador binario (∧, ∨, →, ↔) para generar fórmulas con profundidad mayor que 0.");
        return;
    }

    try {
        const randomFormula = generateRandomFormula(numVars, depth, varsPerSub, allowedOps);
        document.getElementById('expresion').value = randomFormula;
    } catch (error) {
        alert(error.message);
    }
});

// ### Botón Limpiar
document.getElementById('btnLimpiar').addEventListener('click', function() {
    document.getElementById('expresion').value = "";
    document.getElementById('resultadoTabla').innerHTML = "";
    document.getElementById('parseTree').innerHTML = "";
    document.getElementById('numVariables').value = 3;
    document.getElementById('profundidad').value = 3;
    document.getElementById('varsSubformula').value = 2;
});

// ### Inserción de Símbolos mediante Botones
const expresionTextarea = document.getElementById('expresion');

function insertSymbol(symbol) {
    const start = expresionTextarea.selectionStart;
    const end = expresionTextarea.selectionEnd;
    const text = expresionTextarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    expresionTextarea.value = before + symbol + after;
    expresionTextarea.selectionStart = start + symbol.length;
    expresionTextarea.selectionEnd = start + symbol.length;
    expresionTextarea.focus();
}

document.getElementById('btnP').addEventListener('click', function() { insertSymbol('p'); });
document.getElementById('btnQ').addEventListener('click', function() { insertSymbol('q'); });
document.getElementById('btnR').addEventListener('click', function() { insertSymbol('r'); });
document.getElementById('btnS').addEventListener('click', function() { insertSymbol('s'); });
document.getElementById('btnT').addEventListener('click', function() { insertSymbol('t'); });
document.getElementById('btnAnd').addEventListener('click', function() { insertSymbol('∧'); });
document.getElementById('btnOr').addEventListener('click', function() { insertSymbol('∨'); });
document.getElementById('btnNot').addEventListener('click', function() { insertSymbol('¬'); });
document.getElementById('btnConditional').addEventListener('click', function() { insertSymbol('→'); });
document.getElementById('btnBiconditional').addEventListener('click', function() { insertSymbol('↔'); });
document.getElementById('btnOpenParen').addEventListener('click', function() { insertSymbol('('); });
document.getElementById('btnCloseParen').addEventListener('click', function() { insertSymbol(')'); });

// Evento de cambio de idioma
document.getElementById('language').addEventListener('change', function() {
    const selectedLang = this.value;
    updateLanguage(selectedLang);
});

// Inicializar con español
updateLanguage('es');