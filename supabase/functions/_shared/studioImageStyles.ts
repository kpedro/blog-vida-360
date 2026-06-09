/** Presets de estilo visual — Edge Function generate-blog-studio-image. */

export type StudioImageStylePreset = {
  id: string;
  label: string;
  styleBlock: string;
  temperature: number;
};

const PRESETS: StudioImageStylePreset[] = [
  {
    id: "vida_editorial",
    label: "Vida 360º (editorial)",
    temperature: 0.58,
    styleBlock: `ESTILO VISUAL OBRIGATÓRIO — Vida 360º Editorial:
- Fotografia ou ilustração limpa, acolhedora, luminosa
- Temas: natureza, autocuidado, rotina, calma, hábitos saudáveis
- Cores suaves; espaço para overlay no rodapé`,
  },
  {
    id: "forja_geek",
    label: "Forja Geek",
    temperature: 0.72,
    styleBlock: `ESTILO VISUAL OBRIGATÓRIO — Forja Geek:
- Ilustração digital premium cinematográfica
- Paleta: fundo escuro, highlights âmbar (#f59e0b), rim light dramático
- Geek/gamer + empreendedorismo; composição limpa para overlay no rodapé`,
  },
  {
    id: "forja_fantasy",
    label: "Forja Fantasy",
    temperature: 0.68,
    styleBlock: `ESTILO VISUAL OBRIGATÓRIO — Forja Fantasy:
- Digital painting concept art RPG; forja medieval, luz quente`,
  },
  {
    id: "forja_cyber",
    label: "Forja Cyber",
    temperature: 0.7,
    styleBlock: `ESTILO VISUAL OBRIGATÓRIO — Forja Cyber:
- Synthwave: neon azul/magenta, grid geométrico`,
  },
  {
    id: "forja_photo",
    label: "Forja Foto",
    temperature: 0.55,
    styleBlock: `ESTILO VISUAL OBRIGATÓRIO — Forja Foto:
- Fotografia realista profissional, luz natural`,
  },
  { id: "none", label: "Sem preset", temperature: 0.9, styleBlock: "" },
];

export function resolveStudioImageStyleBlock(
  styleId?: string | null,
  extraBlock?: string,
): { preset: StudioImageStylePreset; styleBlock: string; temperature: number } {
  const preset = PRESETS.find((p) => p.id === styleId) ?? PRESETS[0];
  const extra = extraBlock?.trim();
  const styleBlock = [preset.styleBlock, extra].filter(Boolean).join("\n\n");
  return { preset, styleBlock, temperature: preset.temperature };
}
