# Ordenamiento por selección (ascendente) de 8 palabras en memoria de datos
# Pseudocódigo:
#   para i = 0 hasta n-2:
#     min = i
#     para j = i+1 hasta n-1:
#       si A[j] < A[min]: min = j
#     intercambiar A[i] y A[min]
# Registros: s0=fin del arreglo en bytes (32), s1=último i (28), t0=i, t1=min, t2=j,
#   t3/t4=valores leídos, t5=resultado de slt, v0=1 al terminar
# Entrada: arreglo en la dirección 0. Salida: el mismo arreglo ordenado en Mem[0..31]
.data
arr: .word 5, -3, 9, 1, 7, 0, 4, -8
.text
        addi $s0, $zero, 32
        addi $s1, $zero, 28
        addi $t0, $zero, 0
outer:  beq  $t0, $s1, fin
        add  $t1, $t0, $zero
        addi $t2, $t0, 4
inner:  beq  $t2, $s0, swap
        lw   $t3, 0($t2)
        lw   $t4, 0($t1)
        slt  $t5, $t3, $t4
        beq  $t5, $zero, next
        add  $t1, $t2, $zero
next:   addi $t2, $t2, 4
        j    inner
swap:   lw   $t3, 0($t0)
        lw   $t4, 0($t1)
        sw   $t4, 0($t0)
        sw   $t3, 0($t1)
        addi $t0, $t0, 4
        j    outer
fin:    ori  $v0, $zero, 1
end:    j    end
