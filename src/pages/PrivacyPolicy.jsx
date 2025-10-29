import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Botão de voltar */}
        <Link to="/login">
          <Button variant="ghost" className="mb-4 hover:bg-slate-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <Card className="shadow-lg">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex justify-center mb-2">
              <div className="text-2xl font-bold text-exxata-blue">
                Exxata <span className="text-exxata-red">Connect</span>
              </div>
            </div>
            <CardTitle className="text-3xl text-center font-bold text-gray-900">
              Política de Privacidade
            </CardTitle>
            <CardDescription className="text-center text-base">
              Informações sobre coleta, uso, armazenamento e proteção de dados na plataforma Exxata Connect
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8 text-gray-700 leading-relaxed">
            {/* Objetivo */}
            <section>
              <h2 className="text-xl font-bold mb-3 text-gray-900 border-b-2 border-exxata-red pb-2">
                Objetivo
              </h2>
              <p className="text-justify">
                A Exxata valoriza a ética, a integridade e a conformidade legal em todas as suas atividades de negócio. 
                Esta Política de Privacidade tem por finalidade demonstrar o nosso compromisso com a transparência na forma 
                como tratamos os dados pessoais de usuários da plataforma Exxata Connect, bem como expressar nosso 
                comprometimento com a segurança das informações fornecidas. Também buscamos assegurar a conformidade com a 
                Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD) e demais legislações aplicáveis, protegendo os 
                direitos de privacidade dos titulares dos dados.
              </p>
            </section>

            {/* Abrangência */}
            <section>
              <h2 className="text-xl font-bold mb-3 text-gray-900 border-b-2 border-exxata-red pb-2">
                Abrangência
              </h2>
              <p className="text-justify">
                Esta política se aplica ao uso da plataforma Exxata Connect e a todas as operações de tratamento de dados pessoais 
                realizadas pela Exxata no contexto da plataforma. Abrange os dados coletados de usuários (representantes de empresas 
                clientes) ao se cadastrarem e utilizarem os serviços da Exxata Connect, bem como de outros titulares que eventualmente 
                a Exxata Connect precise coletar dados para cumprir as finalidades, sobretudo de cumprimento de contrato. Por isso mesmo, 
                todos os colaboradores, parceiros e fornecedores que possam ter acesso a esses dados pessoais em nome da Exxata estão 
                sujeitos a esta política e às leis de proteção de dados vigentes.
              </p>
            </section>

            {/* Dados Pessoais Coletados */}
            <section>
              <h2 className="text-xl font-bold mb-3 text-gray-900 border-b-2 border-exxata-red pb-2">
                Dados Pessoais Coletados e Finalidades
              </h2>
              <p className="text-justify mb-4">
                Coletamos apenas os dados pessoais necessários para oferecer, executar e aprimorar os serviços da plataforma Exxata 
                Connect, respeitando os princípios de necessidade e adequação previstos na LGPD. Ao utilizar a plataforma, 
                você nos fornece diretamente algumas informações pessoais por meio de formulários de cadastro ou atualizações 
                de perfil. Esses dados incluem:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start">
                  <span className="text-exxata-red font-bold mr-2">•</span>
                  <span><strong>Nome completo:</strong> utilizado para identificar o usuário na plataforma e em comunicações.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exxata-red font-bold mr-2">•</span>
                  <span><strong>E-mail:</strong> utilizado para criação de conta, login, envio de notificações importantes sobre o uso da plataforma (como confirmação de cadastro, redefinição de senha) e eventuais comunicados operacionais.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exxata-red font-bold mr-2">•</span>
                  <span><strong>Telefone:</strong> utilizado opcionalmente para contato direto caso necessário (por exemplo, suporte técnico ou comunicação sobre o serviço).</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exxata-red font-bold mr-2">•</span>
                  <span><strong>Empresa:</strong> nome da empresa que o usuário representa, coletado para fins de registro corporativo e para personalizar a experiência no sistema (vinculando o usuário à organização cliente correspondente).</span>
                </li>
              </ul>
              <p className="text-justify mt-4">
                <strong>Finalidades:</strong> Os dados acima são tratados estritamente para permitir o acesso seguro à plataforma, viabilizar as 
                funcionalidades de gerenciamento de projetos no Exxata Connect, manter contato com os usuários sobre assuntos relacionados ao 
                serviço e executar os contratos relacionados ao Exxata Connect e o titular de dados. Em suma, usamos os dados pessoais para: 
                (a) criar e gerenciar sua conta de usuário; (b) identificar adequadamente os participantes dos projetos dentro da plataforma; 
                (c) fornecer suporte e orientação quando solicitado; (d) enviar informações ou avisos relacionados ao uso da plataforma; 
                (e) executar eventuais contratos relacionados ao titular de dados e a Exxata Connect; (f) auxiliar o titular em relação ao 
                exercício regular de seus direitos; e (g) beneficiá-lo mediante otimização e eficácia dos serviços prestados pela Exxata Connect.
              </p>
              <p className="text-justify mt-3 text-sm italic text-gray-600">
                Vale ressaltar que não coletamos dados pessoais sensíveis (conforme definidos no art. 5º, inciso II, da LGPD, ex: origem étnica, 
                convicções religiosas, dados de saúde, biométricos etc.) durante o uso da plataforma. Os dados solicitados restringem-se ao 
                necessário para identificar o usuário em âmbito profissional e viabilizar contratos e/ou relacionamento comercial.
              </p>
            </section>

            {/* Base Legal */}
            <section>
              <h2 className="text-xl font-bold mb-3 text-gray-900 border-b-2 border-exxata-red pb-2">
                Base Legal para Tratamento de Dados
              </h2>
              <p className="text-justify">
                A Exxata trata os dados pessoais dos usuários da plataforma Exxata Connect com bases legais permitidas na LGPD. Em geral, o 
                tratamento de nome, e-mail, telefone e empresa se dá para a execução de contrato ou de procedimentos preliminares relacionados 
                a contrato do qual o usuário (ou a empresa que ele representa) é parte (art. 7º, V da LGPD). Adicionalmente, determinados 
                tratamentos podem se basear no legítimo interesse da Exxata (art. 7º, IX da LGPD), por exemplo, para manter a segurança da 
                plataforma e prevenir fraudes, sempre respeitando os direitos e liberdades fundamentais dos titulares. Não obstante, é feito 
                também com base no cumprimento de obrigação legal ou regulatória pela Exxata Connect (art. 7º, II, LGPD).
              </p>
            </section>

            {/* Compartilhamento */}
            <section>
              <h2 className="text-xl font-bold mb-3 text-gray-900 border-b-2 border-exxata-red pb-2">
                Compartilhamento de Dados
              </h2>
              <p className="text-justify mb-4">
                Não vendemos ou compartilhamos dados pessoais dos usuários com terceiros para fins de marketing ou propósitos 
                comerciais alheios à operação da plataforma. O acesso aos dados é restrito às pessoas e entidades cuja atuação 
                está diretamente ligada às finalidades aqui descritas. As circunstâncias em que podemos compartilhar dados pessoais são:
              </p>
              <ul className="space-y-3 ml-6">
                <li className="flex items-start">
                  <span className="text-exxata-red font-bold mr-2">•</span>
                  <span><strong>Fornecedores de serviço (Operadores de dados):</strong> Utilizamos o serviço de banco de dados em nuvem Supabase para armazenar e processar, de forma segura, as informações da plataforma. O Supabase atua como um parceiro tecnológico e suboperador dos dados, processando-os apenas conforme nossas instruções e para os fins determinados por nós. O Supabase é certificado em conformidade com o padrão SOC 2 Type 2 e criptografa todos os dados armazenados (em repouso) e em trânsito.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exxata-red font-bold mr-2">•</span>
                  <span><strong>Requisições legais e autoridades governamentais:</strong> Poderemos compartilhar dados pessoais se formos obrigados por lei ou por ordem judicial/autoridade competente. Nessa hipótese, fornecemos somente as informações estritamente exigidas e nos termos da legislação.</span>
                </li>
              </ul>
            </section>

            {/* Segurança */}
            <section>
              <h2 className="text-xl font-bold mb-3 text-gray-900 border-b-2 border-exxata-red pb-2">
                Armazenamento e Segurança dos Dados
              </h2>
              <p className="text-justify mb-3">
                A Exxata adota medidas rigorosas de segurança para proteger os dados pessoais sob sua guarda, em linha com as 
                melhores práticas de mercado e requisitos legais. Os dados dos usuários do Exxata Connect são armazenados em 
                bancos de dados na nuvem (via Supabase) em ambiente seguro, com controles de acesso, criptografia e políticas de segurança.
              </p>
              <p className="text-justify">
                Implementamos controles de autenticação e autorização robustos na plataforma: cada usuário possui credenciais 
                individuais e apenas pode acessar os dados a que está autorizado. A arquitetura do Exxata Connect conta com 
                regras de segurança em nível de linha (Row Level Security) e outras proteções de software para garantir que um 
                cliente não tenha acesso indevido a informações de outro.
              </p>
            </section>

            {/* Retenção */}
            <section>
              <h2 className="text-xl font-bold mb-3 text-gray-900 border-b-2 border-exxata-red pb-2">
                Retenção dos Dados
              </h2>
              <p className="text-justify">
                Nós armazenamos os dados pessoais dos usuários apenas pelo período necessário para cumprir as finalidades para 
                as quais foram coletados ou para atender exigências legais aplicáveis. Os dados da conta (perfil de usuário, 
                projetos etc.) permanecerão ativos enquanto você estiver utilizando a plataforma. Caso o contrato seja encerrado 
                ou o usuário solicite o cancelamento/exclusão de sua conta, removeremos ou anonimizaremos os dados pessoais em 
                nossos sistemas, respeitando os prazos e procedimentos legais.
              </p>
            </section>

            {/* Direitos dos Titulares */}
            <section>
              <h2 className="text-xl font-bold mb-3 text-gray-900 border-b-2 border-exxata-red pb-2">
                Direitos dos Titulares
              </h2>
              <p className="text-justify mb-4">
                Em conformidade com a LGPD, os usuários da plataforma (enquanto titulares dos dados pessoais) possuem uma série 
                de direitos em relação às suas informações. Prezamos pela transparência e facilitamos o exercício desses direitos. 
                Você pode, a qualquer momento, nos contatar para exercer:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start">
                  <span className="text-exxata-red font-bold mr-2">•</span>
                  <span><strong>Confirmação do tratamento:</strong> direito de solicitar confirmação sobre a existência de tratamento de seus dados pessoais.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exxata-red font-bold mr-2">•</span>
                  <span><strong>Acesso aos dados:</strong> direito de acessar os dados pessoais que possuímos sobre você.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exxata-red font-bold mr-2">•</span>
                  <span><strong>Correção de dados:</strong> direito de solicitar a retificação ou complementação de seus dados pessoais.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exxata-red font-bold mr-2">•</span>
                  <span><strong>Anonimização, bloqueio ou eliminação:</strong> direito de requisitar que certos dados sejam anonimizados, bloqueados ou eliminados.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exxata-red font-bold mr-2">•</span>
                  <span><strong>Portabilidade dos dados:</strong> direito de solicitar que os seus dados pessoais sejam transferidos a outro fornecedor de serviço.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-exxata-red font-bold mr-2">•</span>
                  <span><strong>Revogação do consentimento:</strong> direito de, a qualquer momento, retirar um consentimento que tenha nos dado.</span>
                </li>
              </ul>
            </section>

            {/* Transferência Internacional */}
            <section>
              <h2 className="text-xl font-bold mb-3 text-gray-900 border-b-2 border-exxata-red pb-2">
                Transferência Internacional de Dados
              </h2>
              <p className="text-justify">
                Como a infraestrutura de tecnologia da informação da Exxata Connect utiliza serviços de nuvem, é possível que os dados pessoais 
                coletados sejam armazenados ou processados fora do Brasil, incluindo em datacenters localizados nos Estados Unidos ou em outros 
                países. As transferências internacionais de dados serão sempre feitas em conformidade com a LGPD e demais regulamentações, 
                assegurando que os fornecedores envolvidos adotem padrões rigorosos de proteção de dados, no mesmo nível exigido pela LGPD.
              </p>
            </section>

            {/* Encarregado de Dados */}
            <section>
              <h2 className="text-xl font-bold mb-3 text-gray-900 border-b-2 border-exxata-red pb-2">
                Encarregado de Dados e Canal de Contato
              </h2>
              <p className="text-justify mb-4">
                A Exxata nomeou um Encarregado de Proteção de Dados (Data Protection Officer - DPO), que é o (Igor Fontes) responsável por 
                supervisionar as questões relativas a esta política e ao cumprimento da LGPD. Caso você tenha dúvidas, preocupações ou 
                solicitações relativas aos seus dados pessoais, ou deseje exercer quaisquer dos direitos elencados acima, poderá entrar em 
                contato conosco a qualquer momento pelos seguintes canais:
              </p>
              <div className="bg-slate-100 p-4 rounded-lg border-l-4 border-exxata-blue">
                <p className="mb-2"><strong>E-mail:</strong> <a href="mailto:compliance@exxata.com.br" className="text-blue-600 hover:underline">compliance@exxata.com.br</a></p>
                <p><strong>Endereço:</strong> Av. Getúlio Vargas, nº 671, Funcionários, Belo Horizonte/MG, CEP 30112-021 (a/c Encarregado de Dados)</p>
              </div>
            </section>

            {/* Atualizações */}
            <section>
              <h2 className="text-xl font-bold mb-3 text-gray-900 border-b-2 border-exxata-red pb-2">
                Atualizações desta Política
              </h2>
              <p className="text-justify mb-4">
                À medida que a Exxata Connect evoluir ou que novas diretrizes legais de privacidade entrem em vigor, poderemos 
                atualizar esta Política de Privacidade para refletir essas mudanças. Sempre que alguma alteração relevante for 
                realizada, iremos publicar a versão atualizada neste mesmo endereço eletrônico, acompanhada da data de revisão, 
                e comunicaremos os usuários por meio dos canais de contato disponíveis.
              </p>
              <p className="text-sm text-gray-600 font-semibold">
                Última atualização: 28 de outubro de 2025
              </p>
            </section>
          </CardContent>
        </Card>

        {/* Botão de voltar inferior */}
        <div className="mt-6 text-center">
          <Link to="/login">
            <Button variant="outline" className="hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
