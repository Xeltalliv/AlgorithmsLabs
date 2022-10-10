#!/bin/env python

from BinFile import BinFile
import random

if __name__ == "__main__":
	binf = BinFile("numbers", "w+b")
	if(not binf.ok):
		print("Не вдалося відкрити файл")
		exit()
	amount = int(input("Створити файл зі скількома випадковими числами? (1 число = 4 байти)\n"))
	full = amount//65536
	for i in range(full):
		binf.setInts32(i*65536, [random.randint(0, 10000000) for i in range(65536)])
	for i in range(full*65536, amount):
		binf.setInt32(i, random.randint(0, 10000000))
	print("Готово")

