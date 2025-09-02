const GRADES = Array.from({ length: 12 }, (_, i) => {
    const gradeNumber = i + 1;
    let name;
    if (gradeNumber <= 10) {
        name = `כיתה ${String.fromCharCode(1488 + i)}'`;
    } else if (gradeNumber === 11) {
        name = `כיתה יא'`;
    } else if (gradeNumber === 12) {
        name = `כיתה יב'`;
    }
    return {
        id: gradeNumber,
        name: name,
    };
});

export { GRADES };