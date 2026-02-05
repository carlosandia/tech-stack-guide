 import { useEffect } from 'react'
 import { useToolbar } from '../contexts/ToolbarContext'
 import { useModulos } from '../hooks/usePlanos'
 import { Puzzle } from 'lucide-react'
 
 /**
  * AIDEV-NOTE: Página de Módulos
  * Conforme PRD-14 - Gerenciamento de Módulos
  * Exibe todos os módulos disponíveis na plataforma
  */
 
 export function ModulosPage() {
   const { setSubtitle } = useToolbar()
   const { data: modulos, isLoading, error } = useModulos()
 
   useEffect(() => {
     setSubtitle('Gerencie os módulos disponíveis')
     return () => setSubtitle(null)
   }, [setSubtitle])
 
   if (isLoading) {
     return (
       <div className="space-y-6">
         <div className="bg-card rounded-lg border border-border p-6">
           <div className="h-6 w-48 bg-muted rounded animate-pulse mb-4" />
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
             {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
               <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
             ))}
           </div>
         </div>
       </div>
     )
   }
 
   if (error) {
     return (
       <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
         <p className="text-destructive">Erro ao carregar módulos</p>
       </div>
     )
   }
 
   return (
     <div className="space-y-6">
       <div className="bg-card rounded-lg border border-border p-6">
         <h2 className="text-lg font-semibold text-foreground mb-4">Módulos do Sistema</h2>
         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
           {modulos?.map((modulo) => (
             <div
               key={modulo.id}
               className="p-3 rounded-lg border border-border bg-muted/30"
             >
               <div className="flex items-center gap-2">
                 <Puzzle className="w-4 h-4 text-primary" />
                 <span className="text-sm font-medium text-foreground">{modulo.nome}</span>
               </div>
               <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                 {modulo.descricao}
               </p>
               {modulo.obrigatorio && (
                 <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                   Obrigatório
                 </span>
               )}
             </div>
           ))}
           {(!modulos || modulos.length === 0) && (
             <div className="col-span-full text-center py-8">
               <Puzzle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
               <p className="text-muted-foreground">Nenhum módulo cadastrado</p>
             </div>
           )}
         </div>
       </div>
     </div>
   )
 }
 
 export default ModulosPage