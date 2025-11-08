const { analyzeProjectContext } = require('../dist/utils/contextAnalyzer');
const { estimateProjectCost } = require('../dist/utils/costEstimator');

describe('Project context analyzer', () => {
  it('detecta escala enterprise y urgencia', () => {
    const context = analyzeProjectContext('Proyecto integral llave en mano de 500 m2 con entrega urgente en 2 semanas');
    expect(context.scaleOverride).toBe('enterprise');
    expect(context.urgencyMultiplier).toBeGreaterThan(1);
    expect(context.timelineWeeks).toBe(2);
  });

  it('estima costo considerando contexto', () => {
    const context = {
      scaleOverride: 'small',
      urgencyMultiplier: 1.15,
      timelineWeeks: 2
    };
    const estimate = estimateProjectCost({
      sector: 'software',
      priceRange: '10 - 15',
      context
    });
    expect(estimate.targetTotal).toBeGreaterThan(15000);
    expect(estimate.profile).toBeDefined();
  });

  it('aplica ajustes regionales y advertencias para sectores volátiles', () => {
    const context = analyzeProjectContext(
      'Proyecto de construcción integral en Madrid con materiales importados',
      undefined,
      'Madrid, España',
      'construccion'
    );

    expect(context.locationMultiplier).toBeGreaterThan(1);
    expect(context.fluctuationWarning).toBeTruthy();
  });
});

