import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  expr: string;
  forDuration: string;
  severity: 'critical' | 'warning' | 'info';
  isActive: boolean;
  category: 'Disponibilidad' | 'Saturación' | 'Seguridad y Red' | 'Integridad';
}

const STATE_FILE = path.join(process.cwd(), 'prometheus', 'rules_state.json');
const YAML_FILE = path.join(process.cwd(), 'prometheus', 'alerts.yml');

const DEFAULT_RULES: AlertRule[] = [
  {
    id: 'rule-instance-down',
    name: 'InstanceDown',
    description: 'Servidor o endpoint inalcanzable. Crítico para la disponibilidad.',
    expr: 'up == 0',
    forDuration: '1m',
    severity: 'critical',
    isActive: true,
    category: 'Disponibilidad'
  },
  {
    id: 'rule-service-unreachable',
    name: 'ServiceUnreachable',
    description: 'Fallo en chequeo HTTP de servicio web.',
    expr: 'probe_success == 0',
    forDuration: '2m',
    severity: 'critical',
    isActive: true,
    category: 'Disponibilidad'
  },
  {
    id: 'rule-high-cpu',
    name: 'HighCPUUsage',
    description: 'Uso de CPU excepcionalmente alto. Posible malware minero o DoS.',
    expr: '100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 85',
    forDuration: '5m',
    severity: 'warning',
    isActive: true,
    category: 'Saturación'
  },
  {
    id: 'rule-high-memory',
    name: 'HighMemoryUsage',
    description: 'Uso de RAM al límite. Riesgo de OOM (Out of Memory).',
    expr: '(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 90',
    forDuration: '5m',
    severity: 'warning',
    isActive: true,
    category: 'Saturación'
  },
  {
    id: 'rule-disk-low',
    name: 'DiskSpaceLow',
    description: 'Espacio de almacenamiento crítico (menos del 10% libre).',
    expr: '(node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 10',
    forDuration: '5m',
    severity: 'critical',
    isActive: true,
    category: 'Saturación'
  },
  {
    id: 'rule-network-anomaly',
    name: 'NetworkAnomalyRX',
    description: 'Tráfico de red entrante (RX) inusualmente alto (>1Gbps).',
    expr: 'rate(node_network_receive_bytes_total[5m]) > 125000000',
    forDuration: '5m',
    severity: 'warning',
    isActive: true,
    category: 'Seguridad y Red'
  }
];

export const getRules = (): AlertRule[] => {
  if (!fs.existsSync(STATE_FILE)) {
    // Si no existe, lo inicializamos
    saveRulesState(DEFAULT_RULES);
    return DEFAULT_RULES;
  }
  
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(raw) as AlertRule[];
  } catch (error) {
    console.error("Error reading rules_state.json", error);
    return DEFAULT_RULES;
  }
};

const saveRulesState = (rules: AlertRule[]) => {
  fs.writeFileSync(STATE_FILE, JSON.stringify(rules, null, 2), 'utf-8');
  generateYaml(rules);
};

export const updateRule = (id: string, updates: Partial<AlertRule>): AlertRule[] => {
  const rules = getRules();
  const ruleIndex = rules.findIndex(r => r.id === id);
  if (ruleIndex === -1) throw new Error("Regla no encontrada");
  
  rules[ruleIndex] = { ...rules[ruleIndex], ...updates };
  saveRulesState(rules);
  return rules;
};

const generateYaml = (rules: AlertRule[]) => {
  const activeRules = rules.filter(r => r.isActive);
  
  const yamlRules = activeRules.map(r => ({
    alert: r.name,
    expr: r.expr,
    for: r.forDuration,
    labels: {
      severity: r.severity
    },
    annotations: {
      summary: `Alerta: ${r.name} disparada en {{ $labels.instance }}`,
      description: r.description
    }
  }));

  const doc = new yaml.Document();
  doc.contents = doc.createNode({
    groups: [
      {
        name: 'NOC_NOC_Alerts',
        rules: yamlRules
      }
    ]
  });

  fs.writeFileSync(YAML_FILE, String(doc), 'utf-8');
};

export const triggerPrometheusReload = async () => {
  try {
    const res = await fetch("http://localhost:9090/-/reload", { method: 'POST' });
    if (!res.ok) {
      console.warn("Fallo al recargar Prometheus. Asegúrate de iniciar con --web.enable-lifecycle");
      return false;
    }
    return true;
  } catch (e) {
    console.error("Error contactando a Prometheus para recarga", e);
    return false;
  }
};
