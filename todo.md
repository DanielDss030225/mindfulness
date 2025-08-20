# TODO - Correção de Fotos de Perfil na Página post.html

## PROBLEMAS IDENTIFICADOS:

### 1. Foto de perfil do usuário atual não aparece
- [x] Corrigir carregamento da foto de perfil do usuário atual no campo de comentário
- [x] Verificar se a referência do banco de dados está correta (users/${uid}/profile/photoURL)

### 2. Fotos de perfil nos comentários não aparecem
- [x] Corrigir exibição de fotos de perfil nos comentários principais
- [x] Corrigir exibição de fotos de perfil nas respostas (sub-comentários)
- [x] Implementar fallback para foto padrão quando não há foto

### 3. Problemas de referência no banco de dados
- [x] Verificar se as referências do Firebase estão corretas
- [x] Corrigir path para buscar dados do perfil do usuário
- [x] Integrar com sistema de profile-picture.js

### 4. Melhorias gerais
- [x] Implementar atualização em tempo real das fotos de perfil
- [x] Adicionar tratamento de erro para carregamento de imagens
- [x] Otimizar carregamento de fotos de perfil

## ARQUIVOS QUE PRECISAM SER CORRIGIDOS:
- js/post-view.js (principal)
- js/comments.js (se necessário)
- Verificar integração com js/profile-picture.js

## ANÁLISE TÉCNICA:
- O post-view.js usa URLs padrão hardcoded ao invés de buscar do perfil do usuário
- Não há integração com o ProfilePictureManager existente
- Falta listener para mudanças em tempo real das fotos de perfil

