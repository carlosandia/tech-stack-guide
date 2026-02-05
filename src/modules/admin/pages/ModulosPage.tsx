 import { useEffect } from 'react'
 import { useToolbar } from '../contexts/ToolbarContext'
 import { Puzzle } from 'lucide-react'
 
 /**
  * AIDEV-NOTE: Página de Módulos (placeholder)
  * Conforme PRD-14 - Gerenciamento de Módulos
  */
 
 export function ModulosPage() {
   const { setSubtitle } = useToolbar()
 
   useEffect(() => {
     setSubtitle('Gerencie os módulos disponíveis')
     return () => setSubtitle(null)
   }, [setSubtitle])
 
   return (
     <div className="space-y-6">
       <div className="bg-card p-6 rounded-lg border border-border">
         <div className="flex items-center gap-3">
           <Puzzle className="w-6 h-6 text-muted-foreground" />
           <p className="text-muted-foreground">
             Esta página será implementada em breve.
           </p>
         </div>
       </div>
     </div>
   )
 }
 
 export default ModulosPage