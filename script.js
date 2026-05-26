const API_URL = "https://backend-ai-viagens.vercel.app/generate";


const spinner = document.getElementById('loading-spinner');
const btnEnviar = document.getElementById('btn-enviar');
const resultadoContainer = document.getElementById('resultado-container');
const errorContainer = document.getElementById('error-message');
const linhaTempo = document.getElementById('rot-linha-tempo');
const dicasLista = document.getElementById('rot-dicas');

let roteiroAtual = null;

async function gerarRoteiro(event) {
    event.preventDefault();
    const destinoVal = document.getElementById('input-destino').value.trim();
    const diasVal = parseInt(document.getElementById('input-dias').value);
    const orcamentoVal = document.getElementById('select-orcamento').value;
    spinner.classList.remove('hidden');
    btnEnviar.disabled = true;
    errorContainer.classList.add('hidden');
    resultadoContainer.classList.add('hidden');

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                destino: destinoVal,
                dias: diasVal,
                orcamento: orcamentoVal
            })
        });

        const data = await response.json();
        if (data.status === "success") {
            roteiroAtual = data.dados_roteiro;
            exibirRoteiro(roteiroAtual);
        } else {
            mostrarErro(data.message);
        }

    } catch (error) {
        mostrarErro("Erro ao conectar com a API.");
    } finally {
        spinner.classList.add('hidden');
        btnEnviar.disabled = false;
    }
}

function exibirRoteiro(roteiro) {
    document.getElementById('rot-titulo').innerText = roteiro.nome_do_roteiro;
    document.getElementById('rot-destino').innerText = `📍 ${roteiro.destino}`;
    document.getElementById('rot-duracao').innerText = roteiro.duracao;
    document.getElementById('rot-orcamento').innerText = roteiro.perfil_orcamento;
    document.getElementById('rot-custo-total').innerText = roteiro.estimativa_custo_total;
    linhaTempo.innerHTML = "";

    roteiro.roteiro_diario.forEach(diaData => {
        const div = document.createElement('div');
        div.className = "card rounded-2xl p-8";
        let atividades = "";
        diaData.atividades.forEach(act => {
            atividades += `
<div class="bg-[#11151d] border border-[#2b3240] rounded-xl p-5 mb-4">
    <div class="flex justify-between items-start flex-wrap gap-4">
        <span class="bg-blue-500/10 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full">
            ${act.periodo}
        </span>
        <span class="text-green-400 text-sm font-medium">
            💰 ${act.valor}
        </span>
    </div>
    <h4 class="text-xl font-bold mt-4">
        ${act.nome_do_lugar}
    </h4>
    <div class="flex flex-wrap items-center gap-3 mt-3">

    <p class="text-gray-400 text-sm">
        📍 ${act.endereco}
    </p>

    <a 
        href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.endereco)}"
        target="_blank"
        class="bg-blue-500 hover:bg-blue-400 transition text-white text-xs px-3 py-2 rounded-lg"
    >
        Google Maps
    </a>

    <a 
        href="https://waze.com/ul?q=${encodeURIComponent(act.endereco)}"
        target="_blank"
        class="bg-[#202634] hover:bg-[#2b3240] transition text-white text-xs px-3 py-2 rounded-lg"
    >
        Waze
    </a>

</div>
    <p class="text-gray-300 mt-4 leading-relaxed">
        ${act.descricao}
    </p>
</div>
`;
        });

        div.innerHTML = `
<h3 class="text-3xl font-extrabold mb-6">
    ${diaData.dia}
</h3>
${atividades}
`;
        linhaTempo.appendChild(div);
    });

    dicasLista.innerHTML = "";
    roteiro.dicas_uteis.forEach(dica => {
        const li = document.createElement('li');
        li.className = "bg-[#11151d] border border-[#2b3240] rounded-xl p-4";
        li.innerText = dica;
        dicasLista.appendChild(li);
    });

    resultadoContainer.classList.remove('hidden');
    resultadoContainer.scrollIntoView({
        behavior: 'smooth'
    });
}

function baixarPDF() { // Função para baixar o PDF do roteiro gerado
    if (!roteiroAtual) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 20;

    // TÍTULO
    doc.setFontSize(22);
    doc.text(roteiroAtual.nome_do_roteiro, 20, y);
    y += 12;

    // INFO
    doc.setFontSize(12);
    doc.text(`Destino: ${roteiroAtual.destino}`, 20, y);
    y += 8;
    doc.text(`Duração: ${roteiroAtual.duracao}`, 20, y);
    y += 8;
    doc.text(`Orçamento: ${roteiroAtual.perfil_orcamento}`, 20, y);
    y += 8;
    doc.text(`Custo total: ${roteiroAtual.estimativa_custo_total}`, 20, y);
    y += 15;

    // DIAS
    roteiroAtual.roteiro_diario.forEach((dia) => {
        // quebra página
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        doc.setFontSize(18);
        doc.text(dia.dia, 20, y);
        y += 10;
        doc.setFontSize(12);
        dia.atividades.forEach((atividade) => {
            const texto = `
${atividade.periodo}
${atividade.nome_do_lugar}
${atividade.descricao}
Valor: ${atividade.valor}
`;

            const linhas = doc.splitTextToSize(texto, 170);
            doc.text(linhas, 20, y);
            y += linhas.length * 7 + 5;
        });
        y += 10;
    });
    doc.save(`roteiro-${roteiroAtual.destino}.pdf`);
}

async function compartilharRoteiro() { // Função para compartilhar o roteiro de viagem
    if (!roteiroAtual) return;
    let texto = `
✈️ ${roteiroAtual.nome_do_roteiro}
📍 Destino: ${roteiroAtual.destino}
📅 ${roteiroAtual.duracao}
💰 ${roteiroAtual.estimativa_custo_total}
`;

    roteiroAtual.roteiro_diario.forEach((dia) => {
        texto += `\n${dia.dia}\n`;
        dia.atividades.forEach((atividade) => {
            texto += `• ${atividade.periodo} - ${atividade.nome_do_lugar}\n`;
        });
    });
    if (navigator.share) {
        navigator.share({
            title: roteiroAtual.nome_do_roteiro,
            text: texto
        });
    } else {
        navigator.clipboard.writeText(texto);
        alert("Roteiro copiado!");
    }
}