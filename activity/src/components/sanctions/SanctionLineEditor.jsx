import CatalogPicker from './CatalogPicker.jsx';

const IMPACTO_OPTIONS = [
  { value: 'streamer', label: 'Streamer' },
  { value: 'grupo_usuarios', label: 'Grupo de usuarios' },
  { value: 'staff', label: 'Staff' },
];

export default function SanctionLineEditor({ catalog, line, onChange, onRemove, decision }) {
  function update(patch) {
    onChange({ ...line, ...patch });
  }

  function toggleImpacto(value) {
    const current = line.impacto || [];
    update({ impacto: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] });
  }

  return (
    <div className="gradient-frame">
      <div className="embed-fields sanction-line">
        <label>
          <span className="field-title">Tipo de sanción</span>
          <CatalogPicker catalog={catalog} value={line.catalogId} onChange={(id) => update({ catalogId: id })} />
        </label>

        <label>
          <span className="field-title">Facción</span>
          <select value={line.faccion} onChange={(e) => update({ faccion: e.target.value })}>
            <option value="civil">Civil</option>
            <option value="ilegales">Ilegales</option>
            <option value="policial">Policial</option>
          </select>
        </label>

        <label>
          <span className="field-title">Intención</span>
          <select value={line.intencion} onChange={(e) => update({ intencion: e.target.value })}>
            <option value="involuntario">Involuntario</option>
            <option value="negligente">Negligente</option>
            <option value="premeditado">Premeditado</option>
          </select>
        </label>

        <label>
          <span className="field-title">Impacto</span>
          <div className="color-generator-row">
            {IMPACTO_OPTIONS.map((opt) => (
              <label key={opt.value} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={(line.impacto || []).includes(opt.value)}
                  onChange={() => toggleImpacto(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </label>

        {decision && (
          <div className="sanction-decision-preview">
            <strong>{decision.tipo_label}</strong> (severidad S.{decision.severidad_final}) · {decision.pdr} PDR
          </div>
        )}

        <button type="button" className="btn-secondary" onClick={onRemove}>
          Quitar línea
        </button>
      </div>
    </div>
  );
}
