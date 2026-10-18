<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { avatarPadrao, usarAvatarPadraoNoErro } from '../utils/avatarPadrao.js'
import { agruparPodio } from '../domain/RankingPosicoes.js'

const props = defineProps({
  linhas: { type: Array, required: true } // [{ aluno: {nome, fotoUrl}, notaFinal }]
})

const ORDEM_PODIO = [1, 0, 2] // 2º, 1º, 3º — o 1º lugar fica mais alto, no centro
const DEGRAUS = [
  { cor: '#ffd23f', escura: '#a66b00', placa: '#ffe27a' },
  { cor: '#c9d1dc', escura: '#6b7686', placa: '#dfe5ee' },
  { cor: '#d98b4a', escura: '#7a3f12', placa: '#efb27a' }
]

// No celular cabem 2 rostos por degrau; no computador, 3. Quem sobra vira "+N" (a lista completa fica na tabela)
const telaEstreita = ref(false)
let consulta = null
const atualizar = () => (telaEstreita.value = consulta.matches)
onMounted(() => {
  if (!window.matchMedia) return
  consulta = window.matchMedia('(max-width: 640px)')
  atualizar()
  consulta.addEventListener('change', atualizar)
})
onBeforeUnmount(() => consulta?.removeEventListener('change', atualizar))

const primeiroNome = (nome) => nome.trim().split(/\s+/)[0]

function juntarNomes(nomes, max) {
  const visiveis = nomes.slice(0, max)
  const resto = nomes.length - visiveis.length
  if (resto > 0) return `${visiveis.join(', ')} +${resto}`
  if (visiveis.length === 1) return visiveis[0]
  return `${visiveis.slice(0, -1).join(', ')} e ${visiveis.at(-1)}`
}

// Empatados dividem o mesmo degrau
const grupos = computed(() => agruparPodio(props.linhas))

const degraus = computed(() =>
  ORDEM_PODIO.filter((indice) => grupos.value[indice]).map((indice) => {
    const grupo = grupos.value[indice]
    const total = grupo.linhas.length
    const maxRostos = telaEstreita.value ? 2 : 3
    const rostos = total > maxRostos ? grupo.linhas.slice(0, maxRostos - 1) : grupo.linhas
    const nomes = grupo.linhas.map((l) => (telaEstreita.value ? primeiroNome(l.aluno.nome) : l.aluno.nome))
    return {
      indice,
      ...DEGRAUS[indice],
      posicao: grupo.posicao,
      nota: Number(grupo.notaFinal).toFixed(1),
      total,
      rostos,
      mais: total - rostos.length,
      nomes: juntarNomes(nomes, telaEstreita.value ? 2 : 3),
      tamanho: total === 1 ? 'solo' : total === 2 ? 'dupla' : 'grupo'
    }
  })
)
</script>

<template>
  <div class="podio">
    <div
      v-for="d in degraus"
      :key="d.indice"
      class="coluna"
      :class="{ primeiro: d.indice === 0, terceiro: d.indice === 2 }"
      :style="{ '--cor': d.cor, '--escura': d.escura, '--placa': d.placa }"
    >
      <svg class="coroa" :class="{ flutua: d.indice === 0 }" viewBox="0 0 14 10" shape-rendering="crispEdges" aria-hidden="true">
        <rect x="0" y="2" width="2" height="2" fill="currentColor" /><rect x="6" y="0" width="2" height="2" fill="currentColor" />
        <rect x="12" y="2" width="2" height="2" fill="currentColor" /><rect x="1" y="4" width="12" height="4" fill="currentColor" />
        <rect x="3" y="3" width="2" height="1" fill="currentColor" /><rect x="9" y="3" width="2" height="1" fill="currentColor" />
        <rect x="6" y="2" width="2" height="2" fill="currentColor" /><rect x="1" y="8" width="12" height="2" fill="#0a1226" opacity="0.35" />
        <rect x="6" y="5" width="2" height="2" fill="#e11d48" /><rect x="3" y="5" width="1" height="1" fill="#38bdf8" />
        <rect x="10" y="5" width="1" height="1" fill="#38bdf8" />
      </svg>
      <div class="moldura" :class="d.tamanho">
        <img
          v-for="linha in d.rostos"
          :key="linha.aluno.id"
          :src="linha.aluno.fotoUrl || avatarPadrao(linha.aluno.nome)"
          :alt="linha.aluno.nome"
          class="foto"
          @error="usarAvatarPadraoNoErro($event, linha.aluno.nome)"
        />
        <div v-if="d.mais > 0" class="foto mais">+{{ d.mais }}</div>
      </div>
      <div class="placa">
        <span class="nomes">{{ d.nomes }}</span>
        <span class="pontos">{{ d.nota }} pts</span>
        <span v-if="d.total > 1" class="empate">EMPATE x{{ d.total }}</span>
      </div>
      <div class="bloco">
        <span class="numero">{{ d.posicao }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.podio {
  flex: 1 1 auto;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  max-width: 760px;
  margin-top: 18px;
}
.coluna {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 1 210px;
  min-width: 0;
  color: var(--cor);
}
.coluna.primeiro { flex-basis: 280px; }

.coroa { width: 48px; height: 34px; }
.primeiro .coroa { width: 64px; height: 46px; }
.flutua { animation: balanca 2s steps(3) infinite; }
@keyframes balanca { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@media (prefers-reduced-motion: reduce) { .flutua { animation: none; } }

.moldura {
  display: flex;
  gap: 6px;
  max-width: 100%;
  padding: 6px;
  margin-top: -4px;
  background: var(--cor);
  border: 5px solid #0a1226;
  border-radius: 10px;
  box-shadow: inset 0 0 0 3px var(--escura), 4px 4px 0 rgba(0, 0, 0, 0.35);
  --foto: 92px;
}
.primeiro .moldura { --foto: 108px; }
.moldura.dupla { --foto: 70px; }
.primeiro .moldura.dupla { --foto: 84px; }
.moldura.grupo { --foto: 56px; }
.primeiro .moldura.grupo { --foto: 70px; }
.foto {
  display: block;
  flex: 0 1 var(--foto);
  width: var(--foto);
  min-width: 0;
  aspect-ratio: 1;
  height: auto;
  object-fit: cover;
  background: #1d2c52;
  border: 3px solid #0a1226;
  border-radius: 4px;
}
.mais {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  color: #0a1226;
  background: #fff7d1;
}

.placa {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: calc(100% - 24px);
  margin-top: 10px;
  padding: 8px 10px;
  box-sizing: border-box;
  text-align: center;
  color: #13203d;
  font-family: 'Nunito', system-ui, sans-serif;
  font-weight: 800;
  background: var(--placa);
  border: 4px solid #0a1226;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
}
.nomes { font-size: 16px; line-height: 1.2; overflow-wrap: anywhere; }
.pontos { font-size: 17px; }
.empate {
  margin-top: 2px;
  padding: 2px 8px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #fff;
  background: #e11d48;
}

.bloco {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12px;
  box-sizing: border-box;
  background: var(--cor);
  border: 5px solid #0a1226;
  border-bottom: none;
  box-shadow: inset 0 10px 0 rgba(255, 255, 255, 0.35), inset -10px 0 0 rgba(0, 0, 0, 0.18), inset 10px 0 0 rgba(255, 255, 255, 0.12);
}
.primeiro .bloco { height: 160px; }
.terceiro .bloco { height: 90px; }
.numero {
  font-family: 'Press Start 2P', monospace;
  font-size: 44px;
  color: #fff;
  text-shadow: 4px 4px 0 var(--escura), -2px -2px 0 #0a1226, 2px -2px 0 #0a1226, -2px 2px 0 #0a1226;
}
.primeiro .numero { font-size: 54px; }

@media (max-width: 640px) {
  .podio { margin-top: 0; }
  .coluna { flex-basis: 112px; }
  .coluna.primeiro { flex-basis: 142px; }
  .coroa { width: 30px; height: 22px; }
  .primeiro .coroa { width: 40px; height: 28px; }
  .moldura { gap: 3px; padding: 4px; margin-top: 0; border-width: 4px; border-radius: 8px; box-shadow: inset 0 0 0 2px var(--escura); --foto: 56px; }
  .primeiro .moldura { --foto: 64px; }
  .moldura.dupla, .moldura.grupo { --foto: 44px; }
  .primeiro .moldura.dupla, .primeiro .moldura.grupo { --foto: 50px; }
  .foto { border-width: 2px; border-radius: 3px; }
  .mais { font-size: 10px; }
  .placa { width: calc(100% - 12px); margin-top: 6px; padding: 5px 4px; border-width: 3px; border-radius: 6px 6px 0 0; }
  .nomes, .pontos { font-size: 13px; line-height: 1.15; }
  .empate { margin-top: 0; padding: 2px 5px; font-size: 7px; }
  .bloco { height: 84px; padding-top: 8px; border-width: 4px; box-shadow: inset 0 7px 0 rgba(255, 255, 255, 0.35), inset -7px 0 0 rgba(0, 0, 0, 0.18); }
  .primeiro .bloco { height: 116px; }
  .terceiro .bloco { height: 62px; }
  .numero { font-size: 28px; text-shadow: 3px 3px 0 var(--escura), -2px -2px 0 #0a1226, 2px -2px 0 #0a1226, -2px 2px 0 #0a1226; }
  .primeiro .numero { font-size: 34px; }
}
</style>
