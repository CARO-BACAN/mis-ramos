
// Función 1: Redondear notas (ej: 3.95 -> 4.0)
export function roundGrade(num) { return Math.round(num + 0.00001); }

export function calculateSubjectAvg(subject) {
    let weightedSum = 0; 
    let usedWeight = 0; // Peso acumulado de notas QUE EXISTEN

    subject.grades.forEach(grade => {
        let valStr = grade.value ? grade.value.replace(',', '.') : '';
        const weightStr = grade.weight ? grade.weight.replace(',', '.') : '';
        
        let val = parseFloat(valStr);
        const weight = parseFloat(weightStr);

        // Solo calculamos si hay Porcentaje Y Nota válida
        if (!isNaN(weight) && weight > 0 && !isNaN(val)) {
            weightedSum += val * (weight / 100);
            usedWeight += (weight / 100);
        }
    });

    if (usedWeight === 0) return 0;
    
    // Matemática: Suma Ponderada / Peso Usado
    // Ejemplo: (7.0 * 0.3) / 0.3 = 7.0
    return weightedSum / usedWeight;
}