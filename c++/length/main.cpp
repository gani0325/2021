#include <iostream>
#include <math.h>

using namespace std;

double intersectPoint(double x1, double y1, double x2, double y2, double x3, double y3, double x4, double y4, double& x, double& y, bool& isIntersecting);

int main() {
    double x = 0;
    double x1 = 0;
    double x2 = 0;
    double x3 = 0;
    double x4 = 0;
    double y = 0;
    double y1 = 0;
    double y2 = 0;
    double y3 = 0;
    double y4 = 0;
    bool isIntersecting = true;

    cout << "Enter the endpoints of the first line segment : ";
    cin >> x1;
    cin >> y1;
    cin >> x2;
    cin >> y2;

    cout << "Enter the endpoints of the second line segment : ";
    cin >> x3;
    cin >> y3;
    cin >> x4;
    cin >> y4;

    intersectPoint(x1, y1, x2, y2, x3, y3, x4, y4, x, y, isIntersecting);

    return 0;
}

double intersectPoint(double x1, double y1, double x2, double y2, double x3, double y3, double x4, double y4, double& x, double& y, bool& isIntersecting)
{
    x = sqrt(((x1 - x2) * (x1 - x2)) + ((y1 - y2) * (y1 - y2)));
    y = sqrt(((x3 - x4) * (x3 - x4)) + ((y3 - y4) * (y3 - y4)));

    isIntersecting = x > y;
    if (isIntersecting == true)
    {
        cout << "------------------OUTPUT-----------------" << endl;
        cout << "The first line is longer than second line." << endl;
        cout << "First line length is : " << x << endl;
        cout << "Second line length is : " << y << endl;
        return true;
    }
    else {
        cout << "------------------OUTPUT-----------------" << endl;
        cout << "The second line is longer than first line." << endl;
        cout << "First line length is : " << x << endl;
        cout << "Second line length is : " << y << endl;
        return false;
    }
}
