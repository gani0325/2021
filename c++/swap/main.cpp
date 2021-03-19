// Using the “Pass By Reference” make a swap function example.

#include <iostream>
using namespace std;

void swap(int& a, int& b);

int main(void) {
    int a = 5;
    int b = 6;
    cout << "-------Input-------" << endl;
    cout << "a = " << a << endl;
    cout << "b = " << b << endl;

    swap(a, b);     // 참조(Reference)에 의한 호출
    cout << "-------Output------" << endl;
    cout << "a = " << a << endl;
    cout << "b = " << b << endl;

    return 0;
}

void swap(int& a, int& b) {
    int temp = a;
    a = b;
    b = temp;
}