#include <stdio.h>

int number;
int data[1000000];
	
void quickSort(int* data, int start, int end) {
	if (start >= end) {		// ���Ұ� 1���� ��� �״�� �α� 
		return;
	}
	
	int key = start; // Ű�� ù��° ���� (pivot)
	int i = start + 1;
	int j = end;
	int temp;
	
	while (i <= j)  {	// ������ ������ �ݺ� 
		while (data[i] <= data[key]) {	// Ű ������ ū ���� ���� ������ 
			i++;
		}
		while ( j > start && data[j] >= data[key]) {		// Ű ������ ���� ���� ���� ������ 
			j--;
		}
		if (i > j) {	// ���� ������ ���¸� Ű ���� ��ü
			temp = data[j];
			data[j] = data[key];
			data[key] = temp;
		} 
		else {	// �������� �ʾҴٸ� i�� j ��ü
			temp = data[i];
			data[i] = data[j];
			data[j] = temp;		
		}
	} 
	quickSort(data, start, j -1);
	quickSort(data, j+1, end);
}

int main(void) {
	scanf("%d", &number);
	for (int i =0; i< number; i++) {
		scanf("%d", &data[i]);
	}
	quickSort(data, 0, number - 1);
	for (int i = 0; i< number; i++) {
		printf("%d \n", data[i]);
	}
	return 0;
}
