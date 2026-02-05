 import { useState, useCallback } from 'react'
 
 /**
  * AIDEV-NOTE: Hook para buscar endereço via CEP usando ViaCEP
  * API gratuita, sem autenticação
  */
 
 interface EnderecoViaCep {
   logradouro: string
   bairro: string
   cidade: string
   estado: string
 }
 
 interface UseCepLookupReturn {
   buscarCep: (cep: string) => Promise<EnderecoViaCep | null>
   isLoading: boolean
   error: string | null
 }
 
 export function useCepLookup(): UseCepLookupReturn {
   const [isLoading, setIsLoading] = useState(false)
   const [error, setError] = useState<string | null>(null)
 
   const buscarCep = useCallback(async (cep: string): Promise<EnderecoViaCep | null> => {
     const cepLimpo = cep.replace(/\D/g, '')
     
     if (cepLimpo.length !== 8) {
       return null
     }
 
     setIsLoading(true)
     setError(null)
 
     try {
       const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
       const data = await response.json()
 
       if (data.erro) {
         setError('CEP não encontrado')
         return null
       }
 
       return {
         logradouro: data.logradouro || '',
         bairro: data.bairro || '',
         cidade: data.localidade || '',
         estado: data.uf || '',
       }
     } catch (err) {
       setError('Erro ao buscar CEP')
       console.error('Erro ao buscar CEP:', err)
       return null
     } finally {
       setIsLoading(false)
     }
   }, [])
 
   return { buscarCep, isLoading, error }
 }