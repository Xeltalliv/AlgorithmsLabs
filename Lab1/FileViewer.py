#!/bin/env python

from BinFile import BinFile
import random

if __name__ == "__main__":
	binf = BinFile("numbers", "r+b")
	if(not binf.ok):
		print("Не вдалося відкрити файл")
		exit()
	print("Файл має "+str(binf.size)+" чисел.")
	pos = int(input("З якої позиції продивитись файл?\n"))
	amount = int(input("Скільки чисел продивитись?\n"))
	nums = binf.getInts32(pos, amount)
	size = len(str(pos+amount))
	spaces = " "*size
	print("===== Числа =====")
	for i in range(0, len(nums)):
		j = i+pos
		print((spaces+str(j))[(-size):]+": "+str(nums[i]))
	input("")

